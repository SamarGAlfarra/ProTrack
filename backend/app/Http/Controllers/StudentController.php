<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentController extends Controller
{
    /* ===================== Helpers ===================== */

    private function meId(Request $request): int
    {
        return (int) auth()->id();
    }

    private function currentSemesterId(): ?int
    {
        $row = DB::table('semesters')->where('is_current', true)->first();
        return $row?->id;
    }

    private function coalesceTeamName($row): string
    {
        $name = $row->name ?? $row->Name ?? null;
        return $name && trim($name) !== '' ? $name : ('Team #'.$row->id);
    }

    private function findMyApprovedTeamThisSemester(int $userId): ?object
    {
        $semesterId = $this->currentSemesterId();
        if (!$semesterId) return null;

        $row = DB::table('team_members as tm')
            ->join('teams as t', 't.id', '=', 'tm.team_id')
            ->where('tm.student_id', $userId)
            ->where('tm.is_approved', 1)
            ->where('t.semester_id', $semesterId)
            ->select('t.*', 'tm.is_admin')
            ->first();

        if (!$row) return null;

        // تطبيع بعض الحقول
        $row->coalesced_name = $this->coalesceTeamName($row);
        $row->members_limit  = isset($row->members_limit) ? (int)$row->members_limit : null;
        $row->is_admin       = (bool)($row->is_admin ?? 0);
        return $row;
    }

    private function teamApprovedCount(int $teamId): int
    {
        return (int) DB::table('team_members')
            ->where('team_id', $teamId)
            ->where('is_approved', 1)
            ->count();
    }

    private function ensureCapacityOrFail(object $team): void
    {
        if (!empty($team->members_limit)) {
            $approvedCount = $this->teamApprovedCount($team->id);
            if ($approvedCount >= (int) $team->members_limit) {
                abort(response()->json(['message' => 'Members limit reached.'], 400));
            }
        }
    }

    /* 🆕 يحتسب كل الصفوف (Pending + Approved) */
    private function teamTotalCount(int $teamId): int
    {
        return (int) DB::table('team_members')
            ->where('team_id', $teamId)
            ->whereIn('is_approved', [0,1]) // نتجاهل المرفوضين -1 إن وُجدوا
            ->count();
    }

    /* 🆕 سعة شاملة تشمل الدعوات المعلقة */
    private function ensureTotalCapacityOrFail(object $team): void
    {
        if (!empty($team->members_limit)) {
            $total = $this->teamTotalCount($team->id);
            if ($total >= (int) $team->members_limit) {
                abort(response()->json(['message' => 'Team capacity reached (including pending invites).'], 400));
            }
        }
    }

    /* ===================== Header ===================== */

    public function header(Request $request)
    {
        $uid  = $this->meId($request);
        $user = DB::table('users')->where('id', $uid)->first(['id', 'name']);

        $full  = $user?->name ?: '';
        $parts = preg_split('/\s+/', trim($full)) ?: [];
        $first = $parts[0] ?? 'User';

        return response()->json([
            'id'         => $user?->id,
            'full_name'  => $full,
            'first_name' => $first,
        ]);
    }

    /* ===================== Current team ===================== */

    public function currentTeam(Request $request)
    {
        $uid  = $this->meId($request);
        $team = $this->findMyApprovedTeamThisSemester($uid);

        if (!$team) {
            return response()->json(['team' => null]);
        }

        return response()->json([
            'team' => [
                'id'            => $team->id,
                'name'          => $team->coalesced_name,
                'code'          => (string) $team->id,
                'semester_id'   => $team->semester_id,
                'members_limit' => $team->members_limit,
                'is_admin'      => (bool) $team->is_admin,
            ]
        ]);
    }

    /* ===================== Team members ===================== */

    public function teamMembers(Request $request)
    {
        $uid  = $this->meId($request);
        $team = $this->findMyApprovedTeamThisSemester($uid);

        if (!$team) return response()->json(['members' => []]);

        $rows = DB::table('team_members as tm')
            ->join('users as u', 'u.id', '=', 'tm.student_id')
            ->where('tm.team_id', $team->id)
            ->select([
                'u.id as student_id',
                'u.name as student_name',
                'tm.is_approved',
                'tm.is_admin',
            ])
            ->orderBy('u.name')
            ->get();

        $members = $rows->map(function ($r) {
            $status = match ((int)$r->is_approved) {
                1       => 'Approved',
                -1      => 'Rejected',
                default => 'Pending',
            };
            return [
                'student_id'   => (int) $r->student_id,
                'student_name' => $r->student_name,
                'status'       => $status,
                'is_admin'     => (bool) $r->is_admin,
            ];
        })->values();

        return response()->json(['members' => $members]);
    }

    /* ===================== Incoming requests (student view with constraint) ===================== */

    public function incomingRequests(Request $request)
    {
        $uid  = $this->meId($request);
        $sem  = $this->currentSemesterId();

        if (!$sem) {
            return response()->json(['requests' => []]);
        }

        // تحقق إذا الطالب Approved في أي فريق بنفس الفصل
        $alreadyApproved = DB::table('team_members as tm')
            ->join('teams as t', 't.id', '=', 'tm.team_id')
            ->where('tm.student_id', $uid)
            ->where('tm.is_approved', 1)
            ->where('t.semester_id', $sem)
            ->exists();

        if ($alreadyApproved) {
            // إذا هو Approved بفريق، ما نرجع أي Pending
            return response()->json(['requests' => []]);
        }

        // رجّع الدعوات المعلقة له فقط
        $pending = DB::table('team_members as tm')
            ->join('teams as t', function ($join) use ($sem) {
                $join->on('t.id', '=', 'tm.team_id')
                     ->where('t.semester_id', $sem);
            })
            ->leftJoin('users as admin', 'admin.id', '=', 't.team_admin')
            ->where('tm.student_id', $uid)
            ->where('tm.is_approved', 0)
            ->select([
                't.id as team_id',
                DB::raw('COALESCE(t.name, t.Name) as team_name'),
                DB::raw('t.id as team_code'),
                'admin.id as admin_id',
                'admin.name as admin_name',
                DB::raw('tm.student_id as student_id'),
            ])
            ->orderBy('t.id')
            ->get();

        return response()->json(['requests' => $pending]);
    }


    public function approveRequest(Request $request, int $studentId)
    {
        $uid  = $this->meId($request);
        $team = $this->findMyApprovedTeamThisSemester($uid);
        if (!$team || !(bool) $team->is_admin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $semId = $this->currentSemesterId();
        if (!$semId) return response()->json(['message' => 'No active semester.'], 400);

        // ممنوع لو الطالب Approved في فريق آخر بنفس الفصل
        $alreadyInOther = DB::table('team_members as tm')
            ->join('teams as t', 't.id', '=', 'tm.team_id')
            ->where('tm.student_id', $studentId)
            ->where('tm.is_approved', 1)
            ->where('t.semester_id', $semId)
            ->exists();

        if ($alreadyInOther) {
            return response()->json([
                'updated' => false,
                'message' => 'Student is already a member of another team this semester.',
            ], 400);
        }

        // فحص السعة قبل الترقية (Approved فقط)
        $this->ensureCapacityOrFail($team);

        // وافِق فقط على سجل Pending يخص هذا الفريق
        $updated = DB::table('team_members')
            ->where('team_id', $team->id)
            ->where('student_id', $studentId)
            ->where('is_approved', 0)
            ->update(['is_approved' => 1]);

        return response()->json([
            'updated' => (bool) $updated,
            'message' => $updated ? 'Member approved.' : 'No pending record found.',
        ]);
    }

    public function rejectRequest(Request $request, int $studentId)
    {
        $uid  = $this->meId($request);
        $team = $this->findMyApprovedTeamThisSemester($uid);
        if (!$team || !(bool) $team->is_admin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // احذف فقط "طلب الانضمام" (الدعوة المعلّقة) حتى لا يُحذف عضو Approved
        $deleted = DB::table('team_members')
            ->where('team_id', $team->id)
            ->where('student_id', $studentId)
            ->where('is_approved', 0) // مهم: لا نحذف المعتمدين
            ->delete();

        return response()->json([
            'deleted' => (bool) $deleted,
            'message' => $deleted ? 'Request rejected and removed.' : 'No pending record found.',
        ]);
    }


    public function removeMember(Request $request, int $studentId)
    {
        $uid  = $this->meId($request);
        $team = $this->findMyApprovedTeamThisSemester($uid);
        if (!$team || !(bool) $team->is_admin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($studentId === $uid) {
            return response()->json(['message' => 'Cannot remove team admin via this endpoint.'], 400);
        }

        $deleted = DB::table('team_members')
            ->where('team_id', $team->id)
            ->where('student_id', $studentId)
            ->delete();

        return response()->json([
            'deleted' => (bool) $deleted,
            'message' => $deleted ? 'Member removed.' : 'Member not found.',
        ]);
    }

    /* ===================== دعوات موجهة إليّ كطالب ===================== */

    public function myJoinRequests(Request $request)
    {
        $uid = $this->meId($request);
        $sem = $this->currentSemesterId();

        if (!$sem) return response()->json(['requests' => []]);

        $rows = DB::table('team_members as tm')
            ->join('teams as t', function ($join) use ($sem) {
                $join->on('t.id', '=', 'tm.team_id')->where('t.semester_id', $sem);
            })
            ->leftJoin('users as admin', 'admin.id', '=', 't.team_admin')
            ->where('tm.student_id', $uid)
            ->where('tm.is_approved', 0) // دعواتي المعلقة
            ->select([
                't.id as team_id',
                DB::raw('COALESCE(t.name, t.Name) as team_name'),
                DB::raw('t.id as team_code'),
                'admin.id as admin_id',
                'admin.name as admin_name',
                DB::raw('tm.student_id as student_id'),
            ])
            ->orderBy('t.id')
            ->get();

        return response()->json(['requests' => $rows]);
    }

    public function acceptMyInvite(Request $request, int $teamId)
    {
        $uid = $this->meId($request);
        $sem = $this->currentSemesterId();
        if (!$sem) return response()->json(['message' => 'No active semester.'], 400);

        // هل أنا Approved بفريق آخر؟
        $already = DB::table('team_members as tm')
            ->join('teams as t', 't.id', '=', 'tm.team_id')
            ->where('tm.student_id', $uid)
            ->where('tm.is_approved', 1)
            ->where('t.semester_id', $sem)
            ->exists();

        if ($already) {
            return response()->json([
                'message' => 'You are already a member of another team this semester.'
            ], 400);
        }

        // هل الدعوة موجودة كبند Pending في نفس الفصل؟
        $invite = DB::table('team_members as tm')
            ->join('teams as t', 't.id', '=', 'tm.team_id')
            ->where('tm.student_id', $uid)
            ->where('tm.team_id', $teamId)
            ->where('tm.is_approved', 0)
            ->where('t.semester_id', $sem)
            ->select('t.id', 't.members_limit')
            ->first();

        if (!$invite) {
            return response()->json(['message' => 'Invite not found or already processed.'], 404);
        }

        // فحص السعة (Approved فقط)
        $team = (object)[ 'id' => $teamId, 'members_limit' => $invite->members_limit ];
        $this->ensureCapacityOrFail($team);

        DB::transaction(function () use ($teamId, $uid) {
            DB::table('team_members')
                ->where('team_id', $teamId)
                ->where('student_id', $uid)
                ->where('is_approved', 0)
                ->update(['is_approved' => 1]);
        });

        return response()->json(['message' => 'Joined team successfully.']);
    }

    public function rejectMyInvite(Request $request, int $teamId)
    {
        $uid = $this->meId($request);
        $sem = $this->currentSemesterId();
        if (!$sem) return response()->json(['message' => 'No active semester.'], 400);

        $deleted = DB::table('team_members as tm')
            ->join('teams as t', 't.id', '=', 'tm.team_id')
            ->where('tm.student_id', $uid)
            ->where('tm.team_id', $teamId)
            ->where('t.semester_id', $sem)
            ->delete();

        return response()->json([
            'deleted' => (bool) $deleted,
            'message' => $deleted ? 'Invite rejected and removed.' : 'Invite not found.',
        ]);
    }

    /* ===================== Create/Edit Team page ===================== */

    public function createTeamInit(Request $request)
    {
        $uid = $this->meId($request);
        $sem = $this->currentSemesterId();
        if (!$sem) return response()->json(['message' => 'No active semester.'], 400);

        // فريقي الحالي (لو موجود وأنا Approved فيه)
        $myTeam = $this->findMyApprovedTeamThisSemester($uid);

        $teamInfo = null;
        $members  = [];
        if ($myTeam) {
            $teamInfo = [
                'id'            => $myTeam->id,
                'name'          => $myTeam->coalesced_name,
                'team_admin'    => $myTeam->team_admin ?? null,
                'is_admin'      => (bool)($myTeam->is_admin ?? 0),
                'members_limit' => $myTeam->members_limit ?? null,
            ];

            $rows = DB::table('team_members as tm')
                ->join('users as u', 'u.id', '=', 'tm.student_id')
                ->where('tm.team_id', $myTeam->id)
                ->select([
                    'u.id as student_id',
                    'u.name as student_name',
                    'u.phone_number',
                    'u.email',
                    'tm.is_approved',
                    'tm.is_admin',
                ])
                ->orderBy('u.name')
                ->get();

            $members = $rows->map(function ($r) {
                $status = ((int)$r->is_approved === 1 ? 'Approved' : ((int)$r->is_approved === 0 ? 'Pending' : 'Rejected'));
                return [
                    'student_id'   => (int) $r->student_id,
                    'student_name' => $r->student_name,
                    'phone'        => $r->phone_number,
                    'email'        => $r->email,
                    'status'       => $status,
                    'is_admin'     => (bool)$r->is_admin,
                ];
            })->values();
        }

        // المرشحون للدعوة: طلاب معتمدون، ليسوا Approved في أي فريق بنفس الفصل
        $q = trim((string)$request->query('q', ''));

        $approvedStudentIds = DB::table('team_members as tm')
            ->join('teams as t', 't.id', '=', 'tm.team_id')
            ->where('tm.is_approved', 1)
            ->where('t.semester_id', $sem)
            ->pluck('tm.student_id')
            ->all();

        $candidatesQuery = DB::table('users')
            ->where('role', 'student')
            ->where('is_approved', 1)
            ->whereNotIn('id', $approvedStudentIds);

        if ($q !== '') {
            $candidatesQuery->where(function($w) use ($q) {
                $w->where('name', 'like', "%{$q}%")
                  ->orWhere('email', 'like', "%{$q}%")
                  ->orWhere('phone_number', 'like', "%{$q}%")
                  ->orWhere('id', 'like', "%{$q}%");
            });
        }

        if ($myTeam) {
            $pendingInMyTeam = DB::table('team_members')
                ->where('team_id', $myTeam->id)
                ->where('is_approved', 0)
                ->pluck('student_id')
                ->all();
            if (!empty($pendingInMyTeam)) {
                $candidatesQuery->whereNotIn('id', $pendingInMyTeam);
            }
        }

        $candidates = $candidatesQuery
            ->orderBy('name')
            ->limit(100)
            ->get(['id','name','email','phone_number'])
            ->map(fn($u) => [
                'student_id'   => (int) $u->id,
                'student_name' => $u->name,
                'email'        => $u->email,
                'phone'        => $u->phone_number,
            ])->values();

        return response()->json([
            'team'       => $teamInfo,
            'members'    => $members,
            'candidates' => $candidates,
        ]);
    }

    /**
     * إنشاء فريق جديد أو تحديث اسم الفريق الحالي (Upsert)
     * body: { name: string }
     */

public function upsertTeam(Request $request)
{
    $uid = $this->meId($request);
    $sem = $this->currentSemesterId();
    if (!$sem) return response()->json(['message' => 'No active semester.'], 400);

    $name = trim((string)$request->input('name', ''));
    if ($name === '') return response()->json(['message' => 'Team name is required.'], 422);

    $myTeam = $this->findMyApprovedTeamThisSemester($uid);

    // 🚫 داخل فريق لكن ليس أدمن → يمنع تغيير الاسم
    if ($myTeam && !(bool)$myTeam->is_admin) {
        return response()->json([
            'message' => "You can't change team's name or invite others. You are not the team admin"
        ], 403);
    }

    // ✅ تعديل الاسم إذا كان أدمن
    if ($myTeam && (bool)$myTeam->is_admin) {
        DB::table('teams')->where('id', $myTeam->id)->update(['Name' => $name]);
        return response()->json(['team_id' => $myTeam->id, 'message' => 'Team name updated.']);
    }

    // 🆗 إنشاء فريق جديد لو ليس Approved في فريق آخر بهذا الفصل
    $alreadyApprovedElsewhere = DB::table('team_members as tm')
        ->join('teams as t', 't.id', '=', 'tm.team_id')
        ->where('tm.student_id', $uid)
        ->where('tm.is_approved', 1)
        ->where('t.semester_id', $sem)
        ->exists();

    if ($alreadyApprovedElsewhere) {
        return response()->json(['message' => 'You are already a member of another team this semester.'], 400);
    }

    $teamId = DB::table('teams')->insertGetId([
        'Name'          => $name,
        'team_admin'    => $uid,
        'semester_id'   => $sem,
        'members_limit' => 5,
    ]);

    DB::table('team_members')->insert([
        'team_id'     => $teamId,
        'student_id'  => $uid,
        'is_approved' => 1,
        'is_admin'    => 1,
    ]);

    return response()->json(['team_id' => $teamId, 'message' => 'Team created.']);
}




    /**
     * دعوة طالب للانضمام لفريقي (Pending)
     */
    /**
 * دعوة طالب للانضمام لفريقي (Pending)
 */
public function inviteStudent(Request $request, int $studentId)
{
    $uid = $this->meId($request);
    $sem = $this->currentSemesterId();
    if (!$sem) return response()->json(['message' => 'No active semester.'], 400);

    $team = $this->findMyApprovedTeamThisSemester($uid);
    if (!$team || !(bool)$team->is_admin) {
        return response()->json([
            'message' => "You can't change team's name or invite others. You are not the team admin"
        ], 403);
    }

    $userOk = DB::table('users')
        ->where('id', $studentId)
        ->where('role', 'student')
        ->where('is_approved', 1)
        ->exists();
    if (!$userOk) {
        return response()->json(['message' => 'Student user not found or not approved.'], 404);
    }

    $hasStudentRow = DB::table('students')->where('student_id', $studentId)->exists();
    if (!$hasStudentRow) {
        DB::table('students')->insert(['student_id' => $studentId]);
    }

    $alreadyApprovedElsewhere = DB::table('team_members as tm')
        ->join('teams as t', 't.id', '=', 'tm.team_id')
        ->where('tm.student_id', $studentId)
        ->where('tm.is_approved', 1)
        ->where('t.semester_id', $sem)
        ->exists();
    if ($alreadyApprovedElsewhere) {
        return response()->json(['message' => 'Student already in another team this semester.'], 400);
    }

    $exists = DB::table('team_members')
        ->where('team_id', $team->id)
        ->where('student_id', $studentId)
        ->exists();
    if ($exists) {
        return response()->json(['message' => 'Already invited or member.'], 200);
    }

    $this->ensureTotalCapacityOrFail($team);

    try {
        DB::table('team_members')->insert([
            'team_id'     => $team->id,
            'student_id'  => $studentId,
            'is_approved' => 0,
            'is_admin'    => 0,
        ]);
        return response()->json(['message' => 'Invite sent (pending).']);
    } catch (\Throwable $e) {
        return response()->json([
            'message' => 'Could not send invite.',
            'error'   => $e->getMessage(),
        ], 400);
    }
}



    /**
     * إلغاء دعوة Pending أو حذف عضو من فريقي (كأدمن)
     */
    public function removeInviteOrMember(Request $request, int $studentId)
    {
        $uid  = $this->meId($request);
        $team = $this->findMyApprovedTeamThisSemester($uid);
        if (!$team || !(bool)$team->is_admin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($studentId === $uid) {
            return response()->json(['message' => 'Cannot remove team admin via this endpoint.'], 400);
        }

        $deleted = DB::table('team_members')
            ->where('team_id', $team->id)
            ->where('student_id', $studentId)
            ->delete();

        return response()->json([
            'deleted' => (bool)$deleted,
            'message' => $deleted ? 'Invite/member removed.' : 'Nothing to remove.',
        ]);
    }

    /**
     * ترقية عضو إلى أدمن للفريق
     */
    public function makeAdmin(Request $request, int $studentId)
    {
        $uid  = $this->meId($request);
        $team = $this->findMyApprovedTeamThisSemester($uid);
        if (!$team || !(bool)$team->is_admin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // يجب أن يكون Approved قبل الترقية
        $isApprovedMember = DB::table('team_members')
            ->where('team_id', $team->id)
            ->where('student_id', $studentId)
            ->where('is_approved', 1)
            ->exists();
        if (!$isApprovedMember) {
            return response()->json(['message' => 'Member must be approved first.'], 400);
        }

        DB::transaction(function () use ($team, $studentId) {
            DB::table('teams')->where('id', $team->id)->update(['team_admin' => $studentId]);

            DB::table('team_members')
                ->where('team_id', $team->id)
                ->update(['is_admin' => 0]); // إزالة الأدمن عن الجميع أولًا

            DB::table('team_members')
                ->where('team_id', $team->id)
                ->where('student_id', $studentId)
                ->update(['is_admin' => 1]); // ثم تعيين الهدف كأدمن
        });

        return response()->json(['message' => 'Admin updated.']);
    }
}
