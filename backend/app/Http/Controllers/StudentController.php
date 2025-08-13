<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentController extends Controller
{
    private function meId(Request $request): int
    {
        return (int) auth()->id();
    }

    private function currentSemesterId(): ?int
    {
        $row = DB::table('semesters')->where('is_current', true)->first();
        return $row?->id;
    }

    private function findMyApprovedTeamThisSemester(int $userId): ?object
    {
        $semesterId = $this->currentSemesterId();
        if (!$semesterId) return null;

        return DB::table('team_members as tm')
            ->join('teams as t', 't.id', '=', 'tm.team_id')
            ->where('tm.student_id', $userId)
            ->where('tm.is_approved', 1)
            ->where('t.semester_id', $semesterId)
            ->select('t.*', 'tm.is_admin')
            ->first() ?: null;
    }

    // ========== Header ==========
    public function header(Request $request)
    {
        $uid  = $this->meId($request);
        $user = DB::table('users')->where('id', $uid)->first(['id', 'name']);

        $full  = $user?->name ?: '';
        $first = $full ? explode(' ', $full)[0] : 'User';

        return response()->json([
            'id'         => $user?->id,
            'full_name'  => $full,
            'first_name' => $first,
        ]);
    }

    // ========== Current team ==========
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
                'name'          => $team->Name ?? $team->name ?? ('Team #' . $team->id),
                'code'          => (string) $team->id,
                'semester_id'   => $team->semester_id,
                'members_limit' => $team->members_limit ?? null,
                'is_admin'      => (bool) ($team->is_admin ?? 0),
            ]
        ]);
    }

    // ========== Team members ==========
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
                'student_id'   => $r->student_id,
                'student_name' => $r->student_name,
                'status'       => $status,
                'is_admin'     => (bool) $r->is_admin,
            ];
        });

        return response()->json(['members' => $members]);
    }

    // ========== Pending requests for my team (admin) ==========
    public function pendingRequests(Request $request)
    {
        $uid  = $this->meId($request);
        $team = $this->findMyApprovedTeamThisSemester($uid);

        if (!$team || !(bool) $team->is_admin) {
            return response()->json(['requests' => []]);
        }

        $pending = DB::table('team_members as tm')
            ->join('users as u', 'u.id', '=', 'tm.student_id')
            ->join('teams as t', 't.id', '=', 'tm.team_id')
            ->leftJoin('users as admin', 'admin.id', '=', 't.team_admin')
            ->where('tm.team_id', $team->id)
            ->where('tm.is_approved', 0)
            ->select([
                'tm.student_id',
                'u.name as student_name',
                't.id as team_id',
                DB::raw('COALESCE(t.name, t.Name) as team_name'),
                'admin.name as admin_name',
            ])
            ->orderBy('u.name')
            ->get();

        $requests = $pending->map(function ($r) {
            return [
                'team_id'     => $r->team_id,
                'team_name'   => $r->team_name ?? ('Team #' . $r->team_id),
                'team_code'   => (string) $r->team_id,
                'student_id'  => $r->student_id,
                'student_name'=> $r->student_name,
                'admin_name'  => $r->admin_name,
                'admin_can_approve' => true,
            ];
        });

        return response()->json(['requests' => $requests]);
    }

    public function approveRequest(Request $request, int $studentId)
    {
        $uid  = $this->meId($request);
        $team = $this->findMyApprovedTeamThisSemester($uid);
        if (!$team || !(bool) $team->is_admin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // منع الموافقة إذا كان الطالب Approved بفريق آخر في نفس الفصل
        $semId = $this->currentSemesterId();
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

        $updated = DB::table('team_members')
            ->where('team_id', $team->id)
            ->where('student_id', $studentId)
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

        // ❌ المطلوب: حذف السطر من team_members بدلاً من وضع -1
        $deleted = DB::table('team_members')
            ->where('team_id', $team->id)
            ->where('student_id', $studentId)
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
            ->where('tm.is_approved', 0) // دعوات معلّقة لي
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

        // الطالب لا يمكنه قبول دعوة أخرى إن كان Approved بفريق آخر في نفس الفصل
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

        $inviteExists = DB::table('team_members as tm')
            ->join('teams as t', 't.id', '=', 'tm.team_id')
            ->where('tm.student_id', $uid)
            ->where('tm.team_id', $teamId)
            ->where('tm.is_approved', 0)
            ->where('t.semester_id', $sem)
            ->exists();

        if (!$inviteExists) {
            return response()->json(['message' => 'Invite not found or already processed.'], 404);
        }

        DB::table('team_members')
            ->where('team_id', $teamId)
            ->where('student_id', $uid)
            ->update(['is_approved' => 1]);

        return response()->json(['message' => 'Joined team successfully.']);
    }

    public function rejectMyInvite(Request $request, int $teamId)
    {
        $uid = $this->meId($request);
        $sem = $this->currentSemesterId();
        if (!$sem) return response()->json(['message' => 'No active semester.'], 400);

        // ❌ المطلوب: حذف السطر من team_members بدل -1
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
}
