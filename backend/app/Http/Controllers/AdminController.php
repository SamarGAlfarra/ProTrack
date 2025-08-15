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
use Illuminate\Validation\Rule;   
use App\Mail\AdminCredentialsMail;
use App\Mail\SupervisorCredentialsMail;
use App\Mail\StudentCredentialsMail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;   // ✅ add this


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
                'projects'     => $s->projects_no_limit ,
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


        public function setCurrent(Request $request)
    {
        $data = $request->validate([
            'id' => ['required','regex:/^\d{4}[123]$/'], // YYYY + 1|2|3
        ]);

        $id = $data['id'];
        $last = substr($id, -1);

        $map = ['1' => 'fall', '2' => 'spring', '3' => 'summer'];
        $name = $map[$last];

        // make sure model is configured for string PK (see model snippet below)
        $semester = Semester::updateOrCreate(
            ['id' => $id],
            ['name' => $name]
        );

        // flip "current" flag
        Semester::where('is_current', true)->update(['is_current' => false]);
        $semester->is_current = true;
        $semester->save();

        return response()->json([
            'id'   => $semester->id,
            'name' => $semester->name,
        ]);
    }

    public function current()
    {
        $s = Semester::where('is_current', true)->first();
        return $s ? response()->json(['id'=>$s->id, 'name'=>$s->name])
                  : response()->json(['id'=>null, 'name'=>null]);
    }

     public function addAdmin(Request $request)
{
    $data = $request->validate([
        'adminId'    => ['required','string','max:32', Rule::unique('users','id')],
        'name'       => ['required','string','max:255'],
        'email'      => ['required','email','max:255', Rule::unique('users','email')],
        'password'   => ['required','string','min:6'],
        'department' => ['nullable','integer','exists:departments,id'],
    ]);

    $plainPassword = $data['password'];
    $deptId = array_key_exists('department', $data) && $data['department'] !== null
        ? (int) $data['department']
        : null;

    return DB::transaction(function () use ($data, $plainPassword, $deptId) {
        // Create user
        $user = User::create([
            'id'          => $data['adminId'],
            'name'        => $data['name'],
            'email'       => $data['email'],
            'password'    => Hash::make($plainPassword),
            'role'        => 'admin',
            'is_approved' => 1,
            'department'  => $deptId,
        ]);

        // Create admin row
        Admin::create([
            'admin_id' => $data['adminId'],
        ]);

        // Eager-load department and build SAME payload shape as listApprovedAdmins()
        $user->load(['dept:id,name,Name']);
        $departmentName = optional($user->dept)->name
            ?? optional($user->dept)->Name
            ?? ($deptId !== null ? (string)$deptId : '—');

        // Send credentials email
        Mail::to($user->email)->send(new AdminCredentialsMail(
            adminName: $user->name,
            adminId:   $user->id,
            password:  $plainPassword
        ));

        // Return payload with department NAME
        return response()->json([
            'adminId'    => $user->id,
            'name'       => $user->name,
            'department' => $departmentName,
            'role'       => $user->role,
        ], 201);
    });
}

    public function addSupervisor(Request $request)
    {
        $data = $request->validate([
            'supervisorId'       => ['required','string','max:32', Rule::unique('users','id')],
            'name'               => ['required','string','max:255'],
            'email'              => ['required','email','max:255', Rule::unique('users','email')],
            'password'           => ['required','string','min:6'],
            'department'         => ['nullable','integer','exists:departments,id'], // FK id
            'educational_degree' => ['nullable','string','max:255'],
            'projects_no_limit'  => ['nullable','integer','min:1'],
        ]);

        $plainPassword = $data['password'];
        $deptId = array_key_exists('department', $data) && $data['department'] !== null
            ? (int) $data['department']
            : null;
        $degree = $data['educational_degree'] ?? 'Not specified';
        $cap    = $data['projects_no_limit'] ?? 3; // default 3

        return DB::transaction(function () use ($data, $plainPassword, $deptId, $degree, $cap) {
            // 1) Create user
            $user = User::create([
                'id'          => $data['supervisorId'],
                'name'        => $data['name'],
                'email'       => $data['email'],
                'password'    => Hash::make($plainPassword),
                'role'        => 'supervisor',
                'is_approved' => 1,
                'department'  => $deptId,
            ]);

            // 2) Create supervisor row
            $sup = Supervisor::create([
                'supervisor_id'      => $data['supervisorId'],
                'educational_degree' => $degree,
                'projects_no_limit'  => $cap,
            ]);

            // 3) Department name for response
            $user->load(['dept:id,name,Name']);
            $departmentName = optional($user->dept)->name
                ?? optional($user->dept)->Name
                ?? ($deptId !== null ? (string)$deptId : '—');

            // 4) Send credentials email via Mailable (same style as addAdmin)
            Mail::to($user->email)->send(new \App\Mail\SupervisorCredentialsMail(
                supervisorName: $user->name,
                supervisorId:   $user->id,
                password:       $plainPassword
            ));

            // 5) Return payload (matches listApprovedSupervisors)
            return response()->json([
                'supervisorId' => $sup->supervisor_id,
                'name'         => $user->name,
                'degree'       => $sup->educational_degree ?? 'Not specified',
                'department'   => $departmentName,
                'role'         => $user->role,
                'projects'     => $sup->projects_no_limit,
            ], 201);
        });
    }

        public function addStudent(Request $request)
    {
        $data = $request->validate([
            'studentId'  => ['required','string','max:32', Rule::unique('users','id')],
            'name'       => ['required','string','max:255'],
            'email'      => ['required','email','max:255', Rule::unique('users','email')],
            'password'   => ['required','string','min:6'],
            'department' => ['nullable','integer','exists:departments,id'], // FK id or null
        ]);

        $plainPassword = $data['password'];
        $deptId = array_key_exists('department', $data) && $data['department'] !== null
            ? (int) $data['department']
            : null;

        return DB::transaction(function () use ($data, $plainPassword, $deptId) {
            // 1) Create the user (role: student)
            $user = User::create([
                'id'          => $data['studentId'],
                'name'        => $data['name'],
                'email'       => $data['email'],
                'password'    => Hash::make($plainPassword),
                'role'        => 'student',
                'is_approved' => 1,
                'department'  => $deptId,       // nullable FK
            ]);

            // 2) Create the students row
            Student::create([
                'student_id' => $data['studentId'],
            ]);

            // 3) Get department NAME for immediate display (no refresh needed)
            $user->load(['dept:id,name,Name']);
            $departmentName = optional($user->dept)->name
                ?? optional($user->dept)->Name
                ?? ($deptId !== null ? (string)$deptId : '—');

            // 4) Send credentials email via a Mailable (same system as addAdmin)
            //    Make sure you have: use App\Mail\StudentCredentialsMail;
            Mail::to($user->email)->send(new \App\Mail\StudentCredentialsMail(
                studentName: $user->name,
                studentId:   $user->id,
                password:    $plainPassword
            ));

            // 5) Return payload matching listApprovedStudents() shape
            return response()->json([
                'student_id'      => $user->id,
                'student_name'    => $user->name,
                'department'      => $departmentName,
                'project_id'      => null,          // no project yet
                'supervisor_name' => null,          // no supervisor yet
            ], 201);
        });
    }


    public function updateMe(Request $request)
{
    $user = $request->user();

    $request->validate([
        'phone_number' => ['nullable','string','max:50'],
        'photo'        => ['nullable','image','mimes:jpg,jpeg,png,gif,webp','max:4096'],
    ]);

    $data = [];
    if ($request->has('phone_number')) {
        $data['phone_number'] = $request->input('phone_number');
    }
    if ($request->hasFile('photo')) {
        if ($user->photo && \Storage::disk('public')->exists($user->photo)) {
            \Storage::disk('public')->delete($user->photo);
        }
        $data['photo'] = $request->file('photo')->store('users', 'public');
    }

    $user->fill($data);
    $dirty = $user->getDirty();      // fields that WILL be updated

    $saved = $user->save();          // run the UPDATE
    $user->refresh();

    return response()->json([
        'saved'  => $saved,
        'dirty'  => $dirty,
        'user'   => $user,
    ]);
}


}








