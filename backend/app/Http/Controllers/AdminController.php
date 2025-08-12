<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Student;
use App\Models\Supervisor;
use App\Models\Admin;
use App\Models\Semester;            
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;   

class AdminController extends Controller
{
    /**
     * Approved Admins with department name
     */
    public function listApprovedAdmins()
    {
        $rows = User::query()
            ->with(['dept:id,name,Name'])
            ->where('role', 'admin')
            ->where('is_approved', true)
            ->orderBy('id', 'asc')
            ->get();

        $payload = $rows->map(function ($u) {
            return [
                'adminId'    => $u->id,
                'name'       => $u->name,
                'department' => optional($u->dept)->name
                                ?? optional($u->dept)->Name
                                ?? (string) $u->department,
                'role'       => $u->role,
            ];
        });

        return response()->json($payload);
    }

    /**
     * Pending users (now returns department NAME instead of numeric id)
     * Matches AdminDashboard.jsx expectation: [{ userId, name, department, role }]
     */
    public function listPendingUsers()
    {
        $rows = User::query()
            ->with(['dept:id,name,Name'])
            ->where('is_approved', false)
            ->select(['id', 'name', 'department', 'role'])
            ->orderBy('id', 'asc')
            ->get();

        $payload = $rows->map(function ($u) {
            return [
                'userId'     => $u->id,
                'name'       => $u->name,
                'department' => optional($u->dept)->name
                                ?? optional($u->dept)->Name
                                ?? (string) $u->department,
                'role'       => $u->role,
            ];
        });

        return response()->json($payload);
    }

    /**
     * Approved Supervisors with real projects count and department name
     */
    public function listApprovedSupervisors()
    {
        $rows = Supervisor::query()
            ->with([
                'user:id,name,department,role,is_approved',
                'user.dept:id,name,Name',
            ])
            ->whereHas('user', function ($q) {
                $q->where('role', 'supervisor')->where('is_approved', true);
            })
            ->orderBy('supervisor_id', 'asc')
            ->get();

        $payload = $rows->map(function ($s) {
            return [
                'supervisorId' => $s->supervisor_id,
                'name'         => optional($s->user)->name,
                'degree'       => $s->educational_degree ?? 'Not specified',
                'department'   => optional(optional($s->user)->dept)->name
                                  ?? optional(optional($s->user)->dept)->Name
                                  ?? (string) optional($s->user)->department,
                'role'         => optional($s->user)->role,
                'projects'     => 3,
            ];
        });

        return response()->json($payload);
    }

    /**
     * Approved Students with department name
     */
    // app/Http/Controllers/AdminController.php

public function listApprovedStudents(Request $request)
{
    $rows = DB::table('students as st')
        ->join('users as u', 'u.id', '=', 'st.student_id')
        ->where('u.role', 'student')
        ->where('u.is_approved', true)

        // department table join (FK = users.department -> departments.id)
        ->leftJoin('departments as d', 'd.id', '=', 'u.department')

        // approved team membership (if any)
        ->leftJoin('team_members as tm', function ($join) {
            $join->on('tm.student_id', '=', 'st.student_id')
                 ->where('tm.is_approved', true);
        })
        ->leftJoin('teams as t', 't.id', '=', 'tm.team_id')
        ->leftJoin('team_applications as ta', function ($join) {
            $join->on('ta.team_id', '=', 't.id')
                 ->where('ta.status', 'Approved');
        })
        ->leftJoin('projects as p', 'p.project_id', '=', 'ta.project_id')
        ->leftJoin('supervisors as s', 's.supervisor_id', '=', 'p.supervisor_id')
        ->leftJoin('users as su', 'su.id', '=', 's.supervisor_id')

        ->select([
            'st.student_id as student_id',
            'u.name as student_name',

            // ✅ handle both column casings + fallback to users.department
            DB::raw('COALESCE(d.name, d.name, u.department) as department'),

            'p.project_id as project_id',
            'su.name as supervisor_name',
        ])
        ->orderBy('u.name')
        ->get();

    return response()->json($rows);
}




    /**
     * Approve user by ID and create role-specific record
     */
    public function approveUser($id)
    {
        $user = User::findOrFail($id);

        if ($user->is_approved) {
            return response()->json(['message' => 'User is already approved.'], 400);
        }

        switch ($user->role) {
            case 'student':
                Student::firstOrCreate(['student_id' => $user->id]);
                break;

            case 'supervisor':
                Supervisor::firstOrCreate(
                    ['supervisor_id' => $user->id],
                    ['educational_degree' => 'Not specified']
                );
                break;

            case 'admin':
                Admin::firstOrCreate(['admin_id' => $user->id]);
                break;

            default:
                return response()->json(['message' => 'Unsupported role.'], 422);
        }

        $user->is_approved = true;
        $user->save();

        Mail::raw(
            "Hello {$user->name},\n\nYour PROTRACK account has been approved. You can now sign in and start using the platform.\n\nBest regards,\nPROTRACK Team",
            function ($message) use ($user) {
                $message->to($user->email)->subject('PROTRACK Account Approved');
            }
        );

        return response()->json(['message' => 'User approved successfully.']);
    }

    /**
     * Reject user by ID (only if not approved yet)
     */
    public function rejectUser($id)
    {
        $user = User::findOrFail($id);

        if ($user->is_approved) {
            return response()->json(['message' => 'Cannot reject an approved user.'], 400);
        }

        Mail::raw(
            "Hello {$user->name},\n\nYour registration request on PROTRACK has been rejected by the administrator.\nIf you believe this is a mistake, please contact support.\n\nBest regards,\nPROTRACK Team",
            function ($message) use ($user) {
                $message->to($user->email)->subject('PROTRACK Registration Rejected');
            }
        );

        $user->delete();

        return response()->json(['message' => 'User has been rejected and removed.']);
    }

    public function current()
    {
        $sem = Semester::where('is_current', true)->first();
        if (!$sem) {
            return response()->json(['id' => null, 'name' => null], 200);
        }
        return response()->json([
            'id' => $sem->id,       // e.g., '20211'
            'name' => $sem->name ?? $sem->id,
        ], 200);
    }

    // PUT /semesters/current  { id: "20212" }
    public function setCurrent(Request $request)
    {
        $request->validate([
            'id' => 'required|string|max:20'
        ]);
        $id = trim($request->input('id'));

        return DB::transaction(function () use ($id) {
            // create if not exists (use id as name if you don't have a title)
            $sem = Semester::firstOrCreate(
                ['id' => $id],
                ['name' => $id]
            );

            // unset current on all
            Semester::where('is_current', true)->update(['is_current' => false]);

            // set current
            $sem->is_current = true;
            $sem->save();

            return response()->json([
                'id' => $sem->id,
                'name' => $sem->name ?? $sem->id,
                'is_current' => (bool) $sem->is_current,
            ], 200);
        });
    }
}
