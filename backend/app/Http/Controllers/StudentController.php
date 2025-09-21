<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;


class StudentController extends Controller
{
    // ===== Table names =====
    private string $T_USERS        = 'users';
    private string $T_STUDENTS     = 'students';
    private string $T_TEAMS        = 'teams';
    private string $T_TEAM_MEMBERS = 'team_members';
    private string $T_TEAM_APPS    = 'team_applications';
    private string $T_SEMESTERS    = 'semesters';

    // ===== Known PKs (students table uses student_id) =====
    private string $PK_USER     = 'id';
    private string $PK_STUDENT  = 'student_id';
    private string $PK_TEAM     = 'id';
    private string $PK_SEMESTER = 'id';

    protected function currentSemesterId()
    {
        $row = DB::table($this->T_SEMESTERS)->where('is_current', 1)->first();
        if (!$row) abort(409, 'No current semester set.');
        return $row->{$this->PK_SEMESTER};
    }

    protected function myApprovedTeamId($userId, $semesterId)
    {
        $row = DB::table($this->T_TEAM_MEMBERS)
            ->join($this->T_TEAMS, "{$this->T_TEAMS}.{$this->PK_TEAM}", '=', "{$this->T_TEAM_MEMBERS}.team_id")
            ->where("{$this->T_TEAM_MEMBERS}.student_id", $userId)
            ->where("{$this->T_TEAM_MEMBERS}.is_approved", 1)
            ->where("{$this->T_TEAMS}.semester_id", $semesterId)
            ->select("{$this->T_TEAMS}.{$this->PK_TEAM} as team_id")
            ->first();
        return $row?->team_id;
    }

    protected function isTeamAdmin($userId, $teamId)
    {
        $team = DB::table($this->T_TEAMS)->where($this->PK_TEAM, $teamId)->first();
        return $team && (string)$team->team_admin === (string)$userId;
    }

    // ===== Dashboard: My Team Members =====
    public function dashboardMyTeam(Request $request)
    {
        try {
            $userId     = $request->user()->id;
            $semesterId = $this->currentSemesterId();
            $teamId     = $this->myApprovedTeamId($userId, $semesterId);

            if (!$teamId) {
                return response()->json([
                    'hasApprovedTeam' => false,
                    'members' => [],
                    'counters' => ['total'=>0,'approved'=>0,'pending'=>0,'remaining'=>0],
                    'isAdmin' => false,
                    'team' => null,
                ]);
            }

            $team = DB::table($this->T_TEAMS)->where($this->PK_TEAM,$teamId)->first();

            $rows = DB::table($this->T_TEAM_MEMBERS)
                ->join($this->T_USERS, "{$this->T_USERS}.{$this->PK_USER}", '=', "{$this->T_TEAM_MEMBERS}.student_id")
                ->where("{$this->T_TEAM_MEMBERS}.team_id", $teamId)
                ->select(
                    "{$this->T_TEAM_MEMBERS}.student_id as id",
                    "{$this->T_USERS}.name",
                    "{$this->T_TEAM_MEMBERS}.is_approved",
                    "{$this->T_TEAM_MEMBERS}.is_admin"
                )
                ->orderBy("{$this->T_TEAM_MEMBERS}.is_approved") // pending first
                ->orderBy("{$this->T_USERS}.name")
                ->get();

            $approved  = $rows->where('is_approved',1)->count();
            $pending   = $rows->where('is_approved',0)->count();
            $total     = $rows->count();
            $remaining = max(0, (int)$team->members_limit - $total);

            return response()->json([
                'hasApprovedTeam' => true,
                'members' => $rows,
                'counters' => compact('total','approved','pending','remaining'),
                'isAdmin' => $this->isTeamAdmin($userId, $teamId),
                'team' => ['id'=>$teamId, 'name'=>$team->name, 'members_limit'=>$team->members_limit],
            ]);
        } catch (\Throwable $e) {
            Log::error('dashboardMyTeam failed', ['e' => $e]);
            abort(500, 'dashboardMyTeam error');
        }
    }

    public function removeMember(Request $request, $teamId, $studentId)
    {
        $userId = $request->user()->id;
        if (!$this->isTeamAdmin($userId, $teamId)) abort(403, 'Only team admin.');

        $member = DB::table($this->T_TEAM_MEMBERS)->where(['team_id'=>$teamId,'student_id'=>$studentId])->first();
        if (!$member) abort(404, 'Member not found.');
        if ((int)$member->is_admin === 1) abort(409, 'Use leaveTeam to handle admin leaving.');

        DB::table($this->T_TEAM_MEMBERS)->where(['team_id'=>$teamId,'student_id'=>$studentId])->delete();
        return response()->json(['ok'=>true]);
    }

    public function leaveTeam(Request $request, $teamId)
    {
        $userId     = $request->user()->id;
        $semesterId = $this->currentSemesterId();

        $team = DB::table($this->T_TEAMS)->where($this->PK_TEAM,$teamId)->first();
        if (!$team || (string)$team->semester_id !== (string)$semesterId) abort(404,'Team not found.');

        $myRow = DB::table($this->T_TEAM_MEMBERS)->where(['team_id'=>$teamId,'student_id'=>$userId])->first();
        if (!$myRow) abort(404,'You are not in this team.');

        $members = DB::table($this->T_TEAM_MEMBERS)->where('team_id',$teamId)->get();
        $hasAnyOther = $members->where('student_id','!=',$userId)->count() > 0;

        if ((int)$myRow->is_admin !== 1) {
            DB::table($this->T_TEAM_MEMBERS)->where(['team_id'=>$teamId,'student_id'=>$userId])->delete();
            return response()->json(['ok'=>true,'action'=>'left']);
        }

        $hasApprovedApp = DB::table($this->T_TEAM_APPS)
            ->where('team_id',$teamId)
            ->where('status','Approved')
            ->exists();

        if (!$hasAnyOther && !$hasApprovedApp) {
            DB::table($this->T_TEAM_MEMBERS)->where('team_id',$teamId)->delete();
            DB::table($this->T_TEAMS)->where($this->PK_TEAM,$teamId)->delete();
            return response()->json(['ok'=>true,'action'=>'team_deleted']);
        }

        $newAdmin = DB::table($this->T_TEAM_MEMBERS)
            ->where('team_id',$teamId)
            ->where('student_id','!=',$userId)
            ->orderByDesc('is_approved')
            ->orderBy('student_id')
            ->first();

        if (!$newAdmin) abort(409, 'Cannot leave: no members to transfer admin to.');

        DB::table($this->T_TEAM_MEMBERS)->where(['team_id'=>$teamId,'student_id'=>$userId])->delete();
        DB::table($this->T_TEAM_MEMBERS)->where(['team_id'=>$teamId,'student_id'=>$newAdmin->student_id])->update(['is_admin'=>1,'is_approved'=>1]);
        DB::table($this->T_TEAMS)->where($this->PK_TEAM,$teamId)->update(['team_admin'=>$newAdmin->student_id]);

        return response()->json(['ok'=>true,'action'=>'admin_transferred','new_admin'=>$newAdmin->student_id]);
    }

    // ===== Invites =====
    public function incomingInvites(Request $request)
    {
        try {
            $userId     = $request->user()->id;
            $semesterId = $this->currentSemesterId();

            $alreadyApproved = $this->myApprovedTeamId($userId,$semesterId) ? true : false;

            $invites = DB::table($this->T_TEAM_MEMBERS . ' as tm')
                ->join($this->T_TEAMS . ' as t', "t.{$this->PK_TEAM}", '=', 'tm.team_id')
                ->join($this->T_USERS . ' as u', 'u.id', '=', 't.team_admin') // 👈 admin user
                ->where('tm.student_id', $userId)
                ->where('tm.is_approved', 0)
                ->where('t.semester_id', $semesterId)
                ->select(
                    't.' . $this->PK_TEAM . ' as team_id',
                    't.name as team_name',
                    't.team_admin as team_admin_id',
                    'u.name as team_admin_name' // 👈 admin name
                )
                ->get();

            return response()->json([
                'hideSection' => $alreadyApproved,
                'invites' => $invites,
            ]);
        } catch (\Throwable $e) {
            Log::error('incomingInvites failed', ['e'=>$e]);
            abort(500, 'incomingInvites error');
        }
    }

    public function acceptInvite(Request $request, $teamId)
    {
        $userId     = $request->user()->id;
        $semesterId = $this->currentSemesterId();

        if ($this->myApprovedTeamId($userId,$semesterId)) abort(409,'Already approved in a team.');

        $team = DB::table($this->T_TEAMS)->where($this->PK_TEAM,$teamId)->first();
        if (!$team || (string)$team->semester_id !== (string)$semesterId) abort(404,'Team not found.');

        $count = DB::table($this->T_TEAM_MEMBERS)->where('team_id',$teamId)->count();
        if ($count >= (int)$team->members_limit) abort(409,'Team capacity reached.');

        $row = DB::table($this->T_TEAM_MEMBERS)->where(['team_id'=>$teamId,'student_id'=>$userId])->first();
        if (!$row) abort(404,'Invite not found.');

        DB::table($this->T_TEAM_MEMBERS)->where(['team_id'=>$teamId,'student_id'=>$userId])->update(['is_approved'=>1]);

        DB::table($this->T_TEAM_MEMBERS)
            ->join($this->T_TEAMS, "{$this->T_TEAMS}.{$this->PK_TEAM}",'=',"{$this->T_TEAM_MEMBERS}.team_id")
            ->where("{$this->T_TEAM_MEMBERS}.student_id",$userId)
            ->where("{$this->T_TEAM_MEMBERS}.is_approved",0)
            ->where("{$this->T_TEAMS}.semester_id",$semesterId)
            ->delete();

        return response()->json(['ok'=>true]);
    }

    public function rejectInvite(Request $request, $teamId)
    {
        $userId     = $request->user()->id;
        $semesterId = $this->currentSemesterId();

        DB::table($this->T_TEAM_MEMBERS)
            ->join($this->T_TEAMS, "{$this->T_TEAMS}.{$this->PK_TEAM}",'=',"{$this->T_TEAM_MEMBERS}.team_id")
            ->where("{$this->T_TEAM_MEMBERS}.student_id",$userId)
            ->where("{$this->T_TEAM_MEMBERS}.team_id",$teamId)
            ->where("{$this->T_TEAMS}.semester_id",$semesterId)
            ->delete();

        return response()->json(['ok'=>true]);
    }

    // ===== Create/Edit Team (COMPOSITE ID: <semester><dept><serial>) =====
    public function saveTeam(Request $request)
    {
        $request->validate(['team_name' => 'required|string|max:255']);

        $userId     = $request->user()->id;      // your auth ID equals users.id and equals students.student_id
        $semester   = DB::table($this->T_SEMESTERS)->where('is_current', 1)->first();
        if (!$semester) {
            return response()->json(['ok'=>false,'message'=>'No current semester set.'], 409);
        }
        $semesterId = (string)$semester->{$this->PK_SEMESTER};
        $teamName   = trim($request->input('team_name'));

        // Resolve department id: students.department_id → students.department → users.department_id → users.department
        $deptColStudent = Schema::hasColumn($this->T_STUDENTS,'department_id') ? 'department_id'
                          : (Schema::hasColumn($this->T_STUDENTS,'department') ? 'department' : null);
        $deptColUser    = Schema::hasColumn($this->T_USERS,'department_id') ? 'department_id'
                          : (Schema::hasColumn($this->T_USERS,'department') ? 'department' : null);

        $studentRow = DB::table($this->T_STUDENTS)->where($this->PK_STUDENT, $userId)->first();
        $userRow    = DB::table($this->T_USERS)->where($this->PK_USER, $userId)->first();

        $deptId = null;
        if ($deptColStudent && $studentRow && isset($studentRow->{$deptColStudent})) $deptId = $studentRow->{$deptColStudent};
        elseif ($deptColUser && $userRow && isset($userRow->{$deptColUser}))          $deptId = $userRow->{$deptColUser};

        if ($deptId === null || $deptId === '') {
            return response()->json(['ok'=>false,'message'=>'Cannot resolve your department.'], 409);
        }
        $deptId = (string)$deptId;

        try {
            return DB::transaction(function () use ($userId, $semesterId, $deptId, $teamName) {

                // If I already own a team this semester → rename
                $existing = DB::table($this->T_TEAMS)
                    ->where(['team_admin' => $userId, 'semester_id' => $semesterId])
                    ->first();

                if ($existing) {
                    DB::table($this->T_TEAMS)->where($this->PK_TEAM, $existing->{$this->PK_TEAM})
                        ->update(['name' => $teamName]);
                    return response()->json([
                        'ok' => true,
                        'team_id' => $existing->{$this->PK_TEAM},
                        'name' => $teamName,
                        'is_update' => true
                    ]);
                }

                // Guard: if already approved in any team this semester
                $alreadyApproved = DB::table($this->T_TEAM_MEMBERS)
                    ->join($this->T_TEAMS, "{$this->T_TEAMS}.{$this->PK_TEAM}", '=', "{$this->T_TEAM_MEMBERS}.team_id")
                    ->where("{$this->T_TEAM_MEMBERS}.student_id", $userId)
                    ->where("{$this->T_TEAM_MEMBERS}.is_approved", 1)
                    ->where("{$this->T_TEAMS}.semester_id", $semesterId)
                    ->exists();

                if ($alreadyApproved) {
                    return response()->json(['ok'=>false,'message'=>'You are already approved in a team; cannot create another.'], 409);
                }

                // Build composite team id = <semester><dept><serial>
                $prefix    = $semesterId . $deptId;
                $prefixLen = strlen($prefix);

                $prefixedRows = DB::table($this->T_TEAMS)
                    ->whereRaw("CAST({$this->PK_TEAM} AS CHAR) LIKE ?", [$prefix.'%'])
                    ->lockForUpdate()
                    ->pluck($this->PK_TEAM);

                $maxSerial = 0;
                foreach ($prefixedRows as $idVal) {
                    $idStr  = (string)$idVal;
                    $suffix = substr($idStr, $prefixLen);
                    if ($suffix !== '' && ctype_digit($suffix)) {
                        $maxSerial = max($maxSerial, (int)$suffix);
                    }
                }
                $serial = $maxSerial + 1;
                $newId  = (int)($prefix . $serial);

                // Insert team (explicit id)
                $membersLimit = Schema::hasColumn($this->T_TEAMS,'members_limit') ? 5 : 5;
                DB::table($this->T_TEAMS)->insert([
                    $this->PK_TEAM   => $newId,
                    'name'           => $teamName,
                    'team_admin'     => $userId,     // stores student_id (= users.id)
                    'semester_id'    => $semesterId,
                    'members_limit'  => $membersLimit,
                ]);

                // Add admin as approved member
                DB::table($this->T_TEAM_MEMBERS)->insert([
                    'team_id'     => $newId,
                    'student_id'  => $userId,
                    'is_admin'    => 1,
                    'is_approved' => 1,
                ]);

                return response()->json([
                    'ok'       => true,
                    'team_id'  => $newId,
                    'name'     => $teamName,
                    'is_update'=> false
                ]);
            });
        } catch (\Throwable $e) {
            Log::error('saveTeam composite-id error', ['error' => $e->getMessage()]);
            return response()->json(['ok'=>false,'message'=>'saveTeam failed'], 500);
        }
    }

    // ===== People I Can Invite (Admin or Member; member sees list but cannot invite) =====
    public function peopleICanInvite(Request $request)
    {
        try {
            $userId     = $request->user()->id;
            $semesterId = $this->currentSemesterId();

            // Try: team where I am admin
            $team = DB::table($this->T_TEAMS)->where(['team_admin'=>$userId,'semester_id'=>$semesterId])->first();
            $isAdmin = false;

            if ($team) {
                $isAdmin = true;
            } else {
                // If not admin, try: team where I am (approved) member
                $memberTeamId = $this->myApprovedTeamId($userId, $semesterId);
                if ($memberTeamId) {
                    $team = DB::table($this->T_TEAMS)->where($this->PK_TEAM, $memberTeamId)->first();
                }
            }

            if (!$team) {
                return response()->json(['team'=>null,'isAdmin'=>false,'canInvite'=>false,'people'=>[]]);
            }

            // Resolve department (prefer students.department_id; fallback to users.department_id/department)
            $studentDeptCol = Schema::hasColumn($this->T_STUDENTS,'department_id') ? 'department_id'
                               : (Schema::hasColumn($this->T_STUDENTS,'department') ? 'department' : null);
            $userDeptCol    = Schema::hasColumn($this->T_USERS,'department_id') ? 'department_id'
                               : (Schema::hasColumn($this->T_USERS,'department') ? 'department' : null);

            $meStudent = DB::table($this->T_STUDENTS)->where($this->PK_STUDENT,$userId)->first();
            $meUser    = DB::table($this->T_USERS)->where($this->PK_USER,$userId)->first();

            $myDept = null;
            if ($studentDeptCol && $meStudent) $myDept = $meStudent->{$studentDeptCol} ?? null;
            if ($myDept === null && $userDeptCol && $meUser) $myDept = $meUser->{$userDeptCol} ?? null;

            $qName  = strtolower($request->query('name',''));
            $qPhone = strtolower($request->query('phone',''));
            $qId    = strtolower($request->query('studentId',''));
            $qEmail = strtolower($request->query('email',''));

            // Students already approved in ANY team this semester (exclude)
            $approvedIds = DB::table($this->T_TEAM_MEMBERS)
                ->join($this->T_TEAMS, "{$this->T_TEAMS}.{$this->PK_TEAM}",'=',"{$this->T_TEAM_MEMBERS}.team_id")
                ->where("{$this->T_TEAMS}.semester_id",$semesterId)
                ->where("{$this->T_TEAM_MEMBERS}.is_approved",1)
                ->pluck("{$this->T_TEAM_MEMBERS}.student_id")
                ->unique()
                ->toArray();

            // Already in my team (invited or approved) (exclude)
            $alreadyInvited = DB::table($this->T_TEAM_MEMBERS)
                ->where('team_id',$team->{$this->PK_TEAM})
                ->pluck('student_id')
                ->unique()
                ->toArray();

            $people = DB::table($this->T_STUDENTS)
                ->join($this->T_USERS, "{$this->T_USERS}.{$this->PK_USER}",'=',"{$this->T_STUDENTS}.{$this->PK_STUDENT}")
                ->when($myDept, function ($q) use ($studentDeptCol, $userDeptCol, $myDept) {
                    $col = $studentDeptCol
                        ? "{$this->T_STUDENTS}.{$studentDeptCol}"
                        : ($userDeptCol ? "{$this->T_USERS}.{$userDeptCol}" : null);

                    if ($col) {
                        $q->where($col, $myDept);
                    }
                })
                ->whereNotIn("{$this->T_STUDENTS}.{$this->PK_STUDENT}",$approvedIds)
                ->whereNotIn("{$this->T_STUDENTS}.{$this->PK_STUDENT}",$alreadyInvited)
                ->when($qName,  fn($q)=>$q->whereRaw("LOWER({$this->T_USERS}.name) LIKE ?",["%$qName%"]))
                ->when($qPhone, fn($q)=>$q->whereRaw("LOWER({$this->T_USERS}.phone_number) LIKE ?",["%$qPhone%"]))
                ->when($qEmail, fn($q)=>$q->whereRaw("LOWER({$this->T_USERS}.email) LIKE ?",["%$qEmail%"]))
                ->when($qId,   fn($q)=>$q->whereRaw("CAST({$this->T_STUDENTS}.{$this->PK_STUDENT} AS CHAR) LIKE ?",["%$qId%"]))
                ->select("{$this->T_STUDENTS}.{$this->PK_STUDENT} as id","{$this->T_USERS}.name","{$this->T_USERS}.email","{$this->T_USERS}.phone_number")
                ->orderBy("{$this->T_USERS}.name")
                ->get();

            $currentCount = DB::table($this->T_TEAM_MEMBERS)->where('team_id',$team->{$this->PK_TEAM})->count();
            $capacityOk   = $currentCount < (int)$team->members_limit;

            return response()->json([
                'team'=>[
                    'id'=>$team->{$this->PK_TEAM},
                    'name'=>$team->name,
                    'members_limit'=>(int)$team->members_limit,
                    'current_count'=>(int)$currentCount,
                ],
                'isAdmin'=>$isAdmin,
                'canInvite'=> ($isAdmin && $capacityOk),
                'people'=>$people,
            ]);
        } catch (\Throwable $e) {
            Log::error('peopleICanInvite failed', ['e'=>$e]);
            abort(500, 'peopleICanInvite error');
        }
    }

    public function sendInvite(Request $request, $studentId)
    {
        $userId     = $request->user()->id;
        $semesterId = $this->currentSemesterId();

        $team = DB::table($this->T_TEAMS)->where(['team_admin'=>$userId,'semester_id'=>$semesterId])->first();
        if (!$team) abort(409,'You do not own a team this semester.');

        $count = DB::table($this->T_TEAM_MEMBERS)->where('team_id',$team->{$this->PK_TEAM})->count();
        if ($count >= (int)$team->members_limit) abort(409,'Team capacity reached.');

        $approvedElsewhere = DB::table($this->T_TEAM_MEMBERS)
            ->join($this->T_TEAMS, "{$this->T_TEAMS}.{$this->PK_TEAM}",'=',"{$this->T_TEAM_MEMBERS}.team_id")
            ->where("{$this->T_TEAMS}.semester_id",$semesterId)
            ->where("{$this->T_TEAM_MEMBERS}.student_id",$studentId)
            ->where("{$this->T_TEAM_MEMBERS}.is_approved",1)
            ->exists();
        if ($approvedElsewhere) abort(409,'Student already joined another team.');

        $exists = DB::table($this->T_TEAM_MEMBERS)->where(['team_id'=>$team->{$this->PK_TEAM},'student_id'=>$studentId])->exists();
        if ($exists) abort(409,'Already invited/exists.');

        DB::table($this->T_TEAM_MEMBERS)->insert([
            'team_id'     => $team->{$this->PK_TEAM},
            'student_id'  => $studentId,
            'is_admin'    => 0,
            'is_approved' => 0,
        ]);

        return response()->json(['ok'=>true]);
    }

    // ====================== NEW: Applications & Details ======================
public function applicationsOverview(Request $request)
{
    $userId     = $request->user()->id;
    $semesterId = $this->currentSemesterId();

    // Find the (approved) team this semester
    $teamId = $this->myApprovedTeamId($userId, $semesterId);
    $team = null;
    $isAdmin = false;

    if ($teamId) {
        $t = DB::table($this->T_TEAMS)->where($this->PK_TEAM, $teamId)->first();
        if ($t) {
            $isAdmin = ((string)$t->team_admin === (string)$userId);
            $team = [
                'id' => $teamId,
                'name' => $t->name,
                'is_admin' => $isAdmin,
            ];
        }
    }

    // Student department (prefer students.department, fallback users.department)
    $deptColStudent = Schema::hasColumn($this->T_STUDENTS,'department_id') ? 'department_id'
                        : (Schema::hasColumn($this->T_STUDENTS,'department') ? 'department' : null);
    $deptColUser    = Schema::hasColumn($this->T_USERS,'department_id') ? 'department_id'
                        : (Schema::hasColumn($this->T_USERS,'department') ? 'department' : null);

    $studentRow = DB::table($this->T_STUDENTS)->where($this->PK_STUDENT, $userId)->first();
    $userRow    = DB::table($this->T_USERS)->where($this->PK_USER, $userId)->first();
    $deptId = null;
    if ($deptColStudent && $studentRow && isset($studentRow->{$deptColStudent})) $deptId = $studentRow->{$deptColStudent};
    elseif ($deptColUser && $userRow && isset($userRow->{$deptColUser}))          $deptId = $userRow->{$deptColUser};

    // Current application (Pending/Approved/Rejected) if team exists
    $currentApp = null;
    if ($teamId) {
        $app = DB::table($this->T_TEAM_APPS)
            ->where('team_id', $teamId)
            ->orderByRaw("FIELD(status,'Pending','Approved','Rejected')") // Pending first
            ->orderByDesc('status')
            ->first();

        if ($app) {
            $p = DB::table('projects as p')
                ->leftJoin('supervisors as s','s.supervisor_id','=','p.supervisor_id')
                ->leftJoin('users as u','u.id','=','s.supervisor_id')
                ->leftJoin('departments as d','d.id','=','u.department')
                ->where('p.project_id', $app->project_id)
                ->select(
                    'p.project_id as id', 'p.title', 'p.summary',
                    'u.name as sup_name','u.email as sup_email','u.phone_number as sup_phone',
                    's.educational_degree as sup_degree','d.name as dept_name'
                )
                ->first();

            if ($p) {
                $currentApp = [
                    'status'  => $app->status,
                    'project' => [
                        'id'    => $p->id,
                        'title' => $p->title,
                        'description' => $p->summary,
                        'supervisor' => [
                            'name' => $p->sup_name,
                            'email' => $p->sup_email,
                            'phone_number' => $p->sup_phone,
                            'department_name' => $p->dept_name,
                            'educational_degree' => $p->sup_degree,
                        ],
                    ],
                ];
            }
        }
    }

    // Available projects: same department & current semester
    // Available projects: same department & current semester
$available = DB::table('projects as p')
    ->leftJoin('supervisors as s','s.supervisor_id','=','p.supervisor_id')
    ->leftJoin('users as u','u.id','=','s.supervisor_id')
    ->leftJoin('departments as d','d.id','=','u.department')
    ->when($semesterId, fn($q) => $q->where('p.semester_id', $semesterId))
    ->when($deptId, fn($q) => $q->where('u.department', $deptId))

    // 🚫 exclude any project that already has an Approved team application
    ->whereNotExists(function ($q) {
        $q->from('team_applications as ta')
          ->select(DB::raw(1))
          ->whereColumn('ta.project_id', 'p.project_id')
          ->where('ta.status', 'Approved');
    })

    ->select(
        'p.project_id as id','p.title',
        'u.name as sup_name','u.email as sup_email','u.phone_number as sup_phone',
        's.educational_degree as sup_degree','d.name as dept_name'
    )
    ->orderBy('p.title')
    ->get()
    ->map(function ($row) {
        return [
            'id' => $row->id,
            'title' => $row->title,
            'supervisor' => [
                'name' => $row->sup_name,
                'email' => $row->sup_email,
                'phone_number' => $row->sup_phone,
                'department_name' => $row->dept_name,
                'educational_degree' => $row->sup_degree,
            ],
        ];
    });


    return response()->json([
        'team' => $team,
        'current_application' => $currentApp,
        'available_projects' => $available,
    ]);
}

public function applyToProject(Request $request, $projectId)
{
    $userId     = $request->user()->id;
    $semesterId = $this->currentSemesterId();

    // Team must exist & user must be admin of that team
    $teamId = $this->myApprovedTeamId($userId, $semesterId);
    if (!$teamId) abort(409, 'You must belong to a team this semester.');

    $team = DB::table($this->T_TEAMS)->where($this->PK_TEAM, $teamId)->first();
    if (!$team) abort(404, 'Team not found.');
    if ((string)$team->team_admin !== (string)$userId) abort(403, 'Only the team admin can apply.');

    // Team cannot have an Approved or Pending application already
    $existsBlock = DB::table($this->T_TEAM_APPS)
        ->where('team_id', $teamId)
        ->whereIn('status', ['Pending','Approved'])
        ->exists();
    if ($existsBlock) abort(409, 'Team already has a Pending/Approved application.');

    // Project must belong to current semester (optional but sensible)
    $proj = DB::table('projects')->where('project_id', $projectId)->first();
    if (!$proj || (string)$proj->semester_id !== (string)$semesterId) abort(404, 'Project not found for current semester.');

    // Avoid duplicates for this team/project
    $already = DB::table($this->T_TEAM_APPS)
        ->where(['team_id'=>$teamId,'project_id'=>$projectId])
        ->exists();
    if ($already) abort(409, 'Already applied to this project.');

    DB::table($this->T_TEAM_APPS)->insert([
        'team_id'    => $teamId,
        'project_id' => $projectId,
        'status'     => 'Pending',
    ]);

    return response()->json(['ok'=>true,'status'=>'Pending']);
}

public function projectDetails(Request $request, $projectId)
{
    $semesterId = $this->currentSemesterId();

    $row = DB::table('projects as p')
        ->leftJoin('supervisors as s','s.supervisor_id','=','p.supervisor_id')
        ->leftJoin('users as u','u.id','=','s.supervisor_id')
        ->where('p.project_id', $projectId)
        ->where('p.semester_id', $semesterId)
        ->select(
            'p.project_id as id','p.title','p.summary','p.meeting_time','p.meeting_link','p.file_path',
            'u.name as sup_name','u.email as sup_email','u.phone_number as sup_phone',
            's.educational_degree as sup_degree'
        )
        ->first();

    if (!$row) abort(404, 'Project not found.');

    // Parse files if you store them as comma-separated names; otherwise adapt.
    $files = [];
    if (!empty($row->file_path)) {
        // Example: "draft.txt,summary.pdf"
        $parts = array_filter(array_map('trim', explode(',', $row->file_path)));
        foreach ($parts as $p) {
            $files[] = ['name' => $p, 'url' => null];
        }
    }

    // meeting_time label
    $label = null;
    if (!empty($row->meeting_time)) {
        // DB field is datetime; front-end shows "Wednesday 14:00 → 16:00" (we only have start)
        // So just show the raw time/date prettified.
        try {
            $dt = \Carbon\Carbon::parse($row->meeting_time);
            $label = $dt->format('l H:i');
        } catch (\Throwable $e) {
            $label = (string)$row->meeting_time;
        }
    }

    return response()->json([
        'project' => [
            'id' => $row->id,
            'title' => $row->title,
            'summary' => $row->summary,
            'meeting_time' => $row->meeting_time,
            'meeting_time_label' => $label,
            'meeting_link' => $row->meeting_link,
            'files' => $files,
            'supervisor' => [
                'name' => $row->sup_name,
                'email' => $row->sup_email,
                'phone_number' => $row->sup_phone,
                'educational_degree' => $row->sup_degree,
            ],
        ]
    ]);}

    // ---------- Small helpers ----------
    private function currentStudentId(Request $request)
    {
        return $request->user()->id; // students.student_id == users.id
    }

    private function studentProjectId($studentId)
    {
        $row = DB::table('team_members as tm')
            ->join('team_applications as ta', 'ta.team_id', '=', 'tm.team_id')
            ->where('tm.student_id', $studentId)
            ->where('tm.is_approved', 1)
            ->whereRaw('LOWER(ta.status) = ?', ['approved'])
            ->select('ta.project_id', 'tm.team_id')
            ->first();

        return $row ? $row->project_id : null;
    }

    private function ensureTaskBelongsToStudentProject($studentId, $taskId)
    {
        $task = DB::table('project_tasks')->where('id', $taskId)->first();
        if (!$task) return [null, response()->json(['message' => 'Task not found'], 404)];

        $projectId = $this->studentProjectId($studentId);
        if (!$projectId || intval($projectId) !== intval($task->project_id)) {
            return [null, response()->json(['message' => 'Forbidden'], 403)];
        }
        return [$task, null];
    }

    // 1) Enrollment + Project Information
    public function myProject(Request $request)
    {
        $sid = $this->currentStudentId($request);
        $projectId = $this->studentProjectId($sid);

        if (!$projectId) {
            return response()->json(['enrolled' => false]);
        }

        $project = DB::table('projects')
            ->where('project_id', $projectId)
            ->select('project_id', 'title', 'meeting_time', 'meeting_link')
            ->first();

        return response()->json([
            'enrolled' => true,
            'project' => $project
        ]);
    }

    // 2) Project Posts
    public function getProjectPosts(Request $request, $projectId)
    {
        $sid = $this->currentStudentId($request);
        // authorize via enrollment
        if (intval($projectId) !== intval($this->studentProjectId($sid))) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $posts = DB::table('project_posts as pp')
            ->join('users as u', 'u.id', '=', 'pp.author_id')
            ->where('pp.project_id', $projectId)
            ->orderByDesc('pp.timestamp')
            ->get([
                'u.name as author',
                'pp.timestamp',
                'pp.content'
            ]);

        return response()->json(['posts' => $posts]);
    }

    public function addProjectPost(Request $request, $projectId)
    {
        $request->validate([
            'content' => 'required|string|max:5000'
        ]);

        $sid = $this->currentStudentId($request);
        if (intval($projectId) !== intval($this->studentProjectId($sid))) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $now = Carbon::now('Asia/Gaza');

        DB::table('project_posts')->insert([
            'project_id' => $projectId,
            'author_id'  => $sid,
            'timestamp'  => $now,
            'content'    => $request->input('content')
        ]);

        $post = [
            'author'    => DB::table('users')->where('id', $sid)->value('name'),
            'timestamp' => $now->toDateTimeString(),
            'content'   => $request->input('content')
        ];

        return response()->json(['post' => $post], 201);
    }

    // 3) Tasks Overview + Final Grade
    public function getProjectTasks(Request $request, $projectId)
{
    $sid = $this->currentStudentId($request);
    if ((int)$projectId !== (int)$this->studentProjectId($sid)) {
        return response()->json(['message' => 'Forbidden'], 403);
    }

    $rows = DB::table('project_tasks as t')
        ->leftJoin('task_submissions as s', function ($join) use ($sid) {
            $join->on('s.task_id', '=', 't.id')
                 ->where('s.student_id', '=', $sid);
        })
        ->where('t.project_id', $projectId)
        ->orderByDesc('t.timestamp')
        ->get([
            't.id',
            't.title',          // <-- get the real title
            't.deadline',
            't.description',
            't.timestamp',
            't.file',
            's.timestamp as submitted_at',
            's.grade',
            's.file_path'
        ]);

    $tasks = [];
    $sumGrades = 0;
    $taskCount = 0;

    foreach ($rows as $r) {
        $taskCount++;

        // status
        $status = 'Unsubmitted';
        if ($r->submitted_at) {
            $status = (strtotime($r->submitted_at) <= strtotime($r->deadline))
                ? 'Submitted'
                : 'Late';
        }

        if ($r->grade !== null) {
            $sumGrades += (float)$r->grade;
        }

        $tasks[] = [
            'id'          => $r->id,
            'title'       => $r->title ?? ('Task ' . $r->id), // fallback just in case
            'deadline'    => $r->deadline,
            'description' => $r->description,
            'timestamp'   => $r->timestamp,
            'file'        => $r->file,
            'status'      => $status,
        ];
    }

    $final = null;
    if ($taskCount > 0) {
        $final = ($sumGrades / ($taskCount * 10)) * 100.0;
    }

    return response()->json([
        'tasks'       => $tasks,
        'final_grade' => $final,
    ]);
}


    // 4) Submission (read)
    public function getSubmission(Request $request, $taskId)
    {
        $sid = $this->currentStudentId($request);
        [$task, $error] = $this->ensureTaskBelongsToStudentProject($sid, $taskId);
        if ($error) return $error;

        $sub = DB::table('task_submissions')
            ->where('task_id', $taskId)
            ->where('student_id', $sid)
            ->first(['file_path', 'grade', 'timestamp']);

        return response()->json([
            'submission' => $sub
        ]);
    }

    // 5) Submission (create)
    public function createSubmission(Request $request, $taskId)
    {
        $sid = $this->currentStudentId($request);
        [$task, $error] = $this->ensureTaskBelongsToStudentProject($sid, $taskId);
        if ($error) return $error;

        // allow creating even after deadline (will be "Late")
        $existing = DB::table('task_submissions')
            ->where('task_id', $taskId)->where('student_id', $sid)->first();
        if ($existing) {
            return response()->json(['message' => 'Submission already exists. Use update.'], 409);
        }

        $request->validate([
            'files.*' => 'required|file|max:10240' // 10MB each
        ]);

        $paths = [];
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $paths[] = $file->store("task_submissions/{$taskId}/{$sid}", 'public');
            }
        }

        $now = Carbon::now('Asia/Gaza');

        DB::table('task_submissions')->insert([
            'task_id'   => $taskId,
            'student_id'=> $sid,
            'file_path' => implode(',', $paths),
            'grade'     => null,
            'timestamp' => $now
        ]);

        return response()->json(['message' => 'Created'], 201);
    }

    // 6) Submission (update files before deadline)
    public function updateSubmission(Request $request, $taskId)
    {
        $sid = $this->currentStudentId($request);
        [$task, $error] = $this->ensureTaskBelongsToStudentProject($sid, $taskId);
        if ($error) return $error;

        $now = Carbon::now('Asia/Gaza');
        if ($now->greaterThan(Carbon::parse($task->deadline))) {
            return response()->json(['message' => 'Deadline passed. Updating files is not allowed.'], 422);
        }

        $request->validate([
            'files.*' => 'required|file|max:10240'
        ]);

        $sub = DB::table('task_submissions')
            ->where('task_id', $taskId)->where('student_id', $sid)->first();
        if (!$sub) {
            return response()->json(['message' => 'No submission to update. Create first.'], 404);
        }

        $paths = [];
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $paths[] = $file->store("task_submissions/{$taskId}/{$sid}", 'public');
            }
        }

        DB::table('task_submissions')
            ->where('task_id', $taskId)->where('student_id', $sid)
            ->update([
                'file_path' => implode(',', $paths),
                'timestamp' => $now
            ]);

        return response()->json(['message' => 'Updated']);
    }

    // 7) Comments (list)
    public function getComments(Request $request, $taskId)
    {
        $sid = $this->currentStudentId($request);
        [$task, $error] = $this->ensureTaskBelongsToStudentProject($sid, $taskId);
        if ($error) return $error;

        $rows = DB::table('comments as c')
            ->join('users as u', 'u.id', '=', 'c.author_id')
            ->where('c.task_id', $taskId)
            ->where('c.student_id', $sid)
            ->orderByDesc('c.timestamp')
            ->get([
                'u.name as author',
                'c.timestamp',
                'c.comment'
            ]);

        return response()->json(['comments' => $rows]);
    }

    // 8) Comments (add)
    public function addComment(Request $request, $taskId)
    {
        $request->validate([
            'comment' => 'required|string|max:5000'
        ]);

        $sid = $this->currentStudentId($request);
        [$task, $error] = $this->ensureTaskBelongsToStudentProject($sid, $taskId);
        if ($error) return $error;

        $now = Carbon::now('Asia/Gaza');

        DB::table('comments')->insert([
            'task_id'   => $taskId,
            'student_id'=> $sid,
            'author_id' => $sid,
            'timestamp' => $now,
            'comment'   => $request->input('comment')
        ]);

        $comment = [
            'author'    => DB::table('users')->where('id', $sid)->value('name'),
            'timestamp' => $now->toDateTimeString(),
            'comment'   => $request->input('comment')
        ];

        return response()->json(['comment' => $comment], 201);
    }

    public function taskDetails(Request $request, int $taskId)
{
    $user = $request->user();
    if (!$user || $user->role !== 'student') {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    $task = \DB::table('project_tasks')
        ->where('id', $taskId)
        ->first(['id','project_id','title','deadline','description','file']);

    if (!$task) {
        return response()->json(['message' => 'Task not found'], 404);
    }

    // ✅ Permission: the student must belong to a team that holds this project (reserved/approved)
    $allowed = \DB::table('team_members as tm')
        ->join('team_applications as ta', 'ta.team_id', '=', 'tm.team_id')
        ->where('tm.student_id', $user->id)
        ->where('ta.project_id', $task->project_id)
        ->whereIn(\DB::raw('LOWER(ta.status)'), ['reserved','approved'])
        ->exists();

    if (!$allowed) {
        return response()->json(['message' => 'Forbidden'], 403);
    }

    $deadlineGaza = $task->deadline
        ? \Carbon\Carbon::parse($task->deadline)->timezone('Asia/Gaza')
        : null;

    $fileUrl  = null;
    $fileName = null;
    if (!empty($task->file)) {
        $fileUrl  = \Storage::disk('public')->url($task->file);
        $fileName = basename($task->file);
    }

    return response()->json([
        'id'               => (int)$task->id,
        'project_id'       => (int)$task->project_id,
        'title'            => $task->title,
        'description'      => $task->description,
        'deadline_str'     => $deadlineGaza ? $deadlineGaza->format('d/m/Y H:i') : null,
        'file_name'        => $fileName,
        'file_url'         => $fileUrl,
    ]);
}


}