<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Semester;
use App\Models\Supervisor;
use App\Models\Project;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Validation\Rule;
use App\Models\TeamApplication;
use App\Models\Project as ProjectModel; 

class SupervisorController extends Controller
{
    public function myProjects(Request $request)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'supervisor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $semester = Semester::where('is_current', 1)->first();
        if (!$semester) {
            return response()->json(['message' => 'No current semester set.'], 409);
        }

        $sup = Supervisor::find($user->id);
        $limit = $sup ? (int)$sup->projects_no_limit : 5;

        $projects = Project::where('supervisor_id', $user->id)
            ->where('semester_id', $semester->id)
            ->orderBy('title')
            ->get(['project_id as id', 'title']);

        $projects = $projects->map(function ($p) {
            $hasApproved = \DB::table('team_applications')
                ->where('project_id', $p->id)
                ->where('status', 'Approved')
                ->exists();
            $p->status = $hasApproved ? 'Reserved' : 'Available';
            return $p;
        })->values();

        return response()->json([
            'projects_no_limit' => $limit,
            'projects'          => $projects,
        ]);
    }

    protected function currentSemesterId(): string
    {
        $row = Semester::where('is_current', 1)->first();
        if (!$row) abort(409, 'No current semester set.');
        return (string)$row->id;
    }

    protected function nextProjectIdForSupervisor(User $supervisorUser): string
    {
        $semesterId   = $this->currentSemesterId();
        $departmentId = (string)($supervisorUser->department ?? '');
        if ($departmentId === '') abort(422, 'Supervisor has no department set.');

        $prefix = $semesterId . $departmentId;

        $maxId = Project::where('project_id', 'like', $prefix.'%')->max('project_id');

        $serial = 1;
        if ($maxId) {
            $tail = substr((string)$maxId, strlen($prefix));
            $serial = ctype_digit($tail) ? ((int)$tail + 1) : 1;
        }

        return $prefix . (string)$serial;
    }

    /**
     * يبني أقرب DATETIME قادم لليوم/الساعة المطلوبة بدون استخدام nextOrSame/next.
     * يعيد Y-m-d H:i:s أو null إن كانت المدخلات غير صالحة.
     */
    protected function composeMeetingDateTime(?string $day, ?string $time): ?string
    {
        if (!$day || !$time) return null;

        $map = [
            'Sunday'    => Carbon::SUNDAY,    // 0
            'Monday'    => Carbon::MONDAY,    // 1
            'Tuesday'   => Carbon::TUESDAY,   // 2
            'Wednesday' => Carbon::WEDNESDAY, // 3
            'Thursday'  => Carbon::THURSDAY,  // 4
            'Friday'    => Carbon::FRIDAY,    // 5
            'Saturday'  => Carbon::SATURDAY,  // 6
        ];
        if (!isset($map[$day])) return null;
        if (!preg_match('/^\d{2}:\d{2}$/', $time)) return null; // HH:mm

        [$h, $m] = explode(':', $time);
        $now = Carbon::now();

        // احسب الفرق بالأيام إلى اليوم المطلوب (0..6)
        $todayDow = (int)$now->dayOfWeek;          // 0=Sun .. 6=Sat
        $targetDow = (int)$map[$day];
        $delta = ($targetDow - $todayDow + 7) % 7; // أيام حتى اليوم المطلوب

        // ابنِ المرشح (اليوم الحالي أو القادم) بالساعة المطلوبة
        $candidate = $now->copy()
            ->startOfDay()
            ->addDays($delta)
            ->setTime((int)$h, (int)$m, 0);

        // إذا كان اليوم نفسه لكن الوقت مضى، ادفعه أسبوعاً
        if ($candidate->lessThan($now)) {
            $candidate->addDays(7);
        }

        return $candidate->format('Y-m-d H:i:s');
    }

    /**
 * حفظ الملفات (0..5) داخل storage/app/public/projects/{project_id}/
 * مع الحفاظ على الاسم الأصلي للملف (وبناء اسم فريد عند التعارض).
 * يُرجع مصفوفة المسارات النسبية ليتم حفظها في DB (CSV كما هو عندك).
 */
protected function saveUploadedFiles(Request $request, string $projectId): array
{
    $saved = [];
    if ($request->hasFile('files')) {
        foreach ($request->file('files') as $file) {
            if (!$file->isValid()) continue;

            $dir = "projects/{$projectId}";
            $original = $file->getClientOriginalName();
            $safeName = $this->uniqueFilename($dir, $original);

            // نحفظ بالاسم (الأصلي أو الفريد)
            $path = $file->storeAs($dir, $safeName, 'public'); // مثال: projects/2024211/report.pdf
            $saved[] = $path;
        }
    }
    return $saved;
}


    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) abort(401);

        $validated = $request->validate([
            'title'        => ['required', 'string', 'max:255'],
            'meeting_day'  => ['nullable', 'string', 'max:20'],
            'start_time'   => ['nullable', 'string', 'max:10'],
            'meeting_link' => ['nullable', 'string', 'max:255'],
            'summary'      => ['nullable', 'string'],
            'files.*'      => ['file', 'max:8192'],
        ]);

        $projectId = $this->nextProjectIdForSupervisor($user);

        $paths = $this->saveUploadedFiles($request, $projectId);
        $fileCsv = empty($paths) ? null : implode(',', $paths);

        // ✅ DATETIME صالح
        $meetingTime = $this->composeMeetingDateTime(
            $validated['meeting_day'] ?? null,
            $validated['start_time'] ?? null
        );

        $project = new Project();
        $project->project_id    = $projectId;
        $project->supervisor_id = $user->id;
        $project->title         = $validated['title'];
        $project->meeting_time  = $meetingTime; // DATETIME أو NULL
        $project->meeting_link  = $validated['meeting_link'] ?? null;
        $project->summary       = $validated['summary'] ?? null;
        $project->file_path     = $fileCsv;
        $project->semester_id   = $this->currentSemesterId();
        $project->number        = 1;

        $project->save();

        return response()->json([
            'ok'         => true,
            'project_id' => $project->project_id,
            'file_paths' => $paths,
        ], 201);
    }

    public function update(Request $request, string $projectId)
    {
        $user = $request->user();
        if (!$user) abort(401);

        $project = Project::where('project_id', $projectId)
            ->where('supervisor_id', $user->id)
            ->firstOrFail();

        $validated = $request->validate([
            'title'        => ['sometimes', 'string', 'max:255'],
            'meeting_day'  => ['nullable', 'string', 'max:20'],
            'start_time'   => ['nullable', 'string', 'max:10'],
            'meeting_link' => ['nullable', 'string', 'max:255'],
            'summary'      => ['nullable', 'string'],
            'files.*'      => ['file', 'max:8192'],
        ]);

        if (array_key_exists('title', $validated))        $project->title        = $validated['title'];
        if (array_key_exists('meeting_link', $validated)) $project->meeting_link = $validated['meeting_link'];
        if (array_key_exists('summary', $validated))      $project->summary      = $validated['summary'];

        if (array_key_exists('meeting_day', $validated) || array_key_exists('start_time', $validated)) {
            $day  = $validated['meeting_day'] ?? null;
            $time = $validated['start_time']  ?? null;
            $project->meeting_time = $this->composeMeetingDateTime($day, $time); // ✅
        }

        if ($request->hasFile('files')) {
            $new = $this->saveUploadedFiles($request, $project->project_id);
            $existing = [];
            if (!empty($project->file_path)) $existing = explode(',', $project->file_path);
            $all = array_merge($existing, $new);
            $project->file_path = empty($all) ? null : implode(',', $all);
        }

        $project->save();

        return response()->json(['ok' => true]);
    }

    // Helper: map 0..6 -> day name like your dropdown
protected function dayNameFromDow(int $dow): string
{
    // Carbon: 0=Sunday .. 6=Saturday
    $names = [
        0 => 'Sunday',
        1 => 'Monday',
        2 => 'Tuesday',
        3 => 'Wednesday',
        4 => 'Thursday',
        5 => 'Friday',
        6 => 'Saturday',
    ];
    return $names[$dow] ?? 'Sunday';
}

/**
 * GET /api/supervisor/projects/{projectId}
 * يرجّع بيانات مشروع واحد يخص المشرف الحالي
 */
public function show(Request $request, string $projectId)
{
    $user = $request->user();
    if (!$user) abort(401);

    $project = Project::where('project_id', $projectId)
        ->where('supervisor_id', $user->id)
        ->firstOrFail();

    // حوّل meeting_time (DATETIME) إلى day + HH:mm إن وُجد
    $meetingDay  = null;
    $startTime   = null;
    if (!empty($project->meeting_time)) {
        $dt = Carbon::parse($project->meeting_time);
        $meetingDay = $this->dayNameFromDow((int)$dt->dayOfWeek);
        $startTime  = $dt->format('H:i');
    }

    // فك CSV للملفات وأعطِ روابط
    $files = [];
    $file_urls = [];
    if (!empty($project->file_path)) {
        $files = array_values(array_filter(explode(',', $project->file_path)));
        foreach ($files as $p) {
            $file_urls[] = \Storage::disk('public')->url($p);
        }
    }

    return response()->json([
        'project_id'   => $project->project_id,
        'title'        => $project->title,
        'meeting_link' => $project->meeting_link,
        'summary'      => $project->summary,
        'meeting_day'  => $meetingDay,   // ex: "Monday"
        'start_time'   => $startTime,    // ex: "10:00"
        'files'        => $files,
        'file_urls'    => $file_urls,
    ]);
}

/**
 * أعِد اسمًا فريدًا داخل مجلد التخزين إن كان الاسم موجودًا مسبقًا.
 * مثال: "report.pdf" -> "report(1).pdf" ... وهكذا.
 */
protected function uniqueFilename(string $dir, string $originalName): string
{
    $disk = 'public';
    $name = $originalName;

    if (!\Storage::disk($disk)->exists($dir.'/'.$name)) {
        return $name;
    }

    $ext  = pathinfo($originalName, PATHINFO_EXTENSION);
    $base = pathinfo($originalName, PATHINFO_FILENAME);

    $i = 1;
    do {
        $candidate = $ext ? "{$base}({$i}).{$ext}" : "{$base}({$i})";
        $i++;
    } while (\Storage::disk($disk)->exists($dir.'/'.$candidate));

    return $candidate;
}
public function incomingRequests(Request $request)
{
    $user = $request->user();
    if (!$user || $user->role !== 'supervisor') {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    $semesterId = $this->currentSemesterId();

    $rows = \DB::table('team_applications as ta')
        ->join('projects as p', 'p.project_id', '=', 'ta.project_id')
        ->join('teams as t', 't.id', '=', 'ta.team_id')
        ->where('p.supervisor_id', $user->id)
        ->where('p.semester_id', $semesterId)
        ->where('ta.status', 'Pending')
        ->orderBy('t.name')
        ->get([
            'ta.team_id',
            'ta.project_id',
            't.name as team_name',
            'p.title as project_title',
        ]);

    return response()->json(['requests' => $rows]);
}

// GET /api/supervisor/team/{teamId}/members
public function teamMembers(Request $request, string $teamId)
{
    $user = $request->user();
    if (!$user) abort(401);

    $members = \DB::table('team_members as tm')
        ->join('students as s', 's.student_id', '=', 'tm.student_id')
        ->join('users as u', 'u.id', '=', 's.student_id')
        ->where('tm.team_id', $teamId)
        ->select(['u.name as name', 's.student_id'])
        ->orderBy('u.name')
        ->get();

    return response()->json(['members' => $members]);
}

// PATCH /api/supervisor/team-applications/{teamId}/{projectId}
// PATCH /api/supervisor/team-applications/{teamId}/{projectId}

public function updateTeamApplicationStatus(Request $request, string $teamId, string $projectId)
{
    $user = $request->user();
    if (!$user || $user->role !== 'supervisor') {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    $validated = $request->validate([
        'status' => ['required', Rule::in(['Approved','Rejected'])],
    ]);

    // Verify the project belongs to this supervisor
    $project = DB::table('projects')
        ->where('project_id', $projectId)
        ->where('supervisor_id', $user->id)
        ->first();

    if (!$project) {
        return response()->json(['message' => 'Not found'], 404);
    }

    return DB::transaction(function () use ($teamId, $projectId, $validated) {

        // Lock this app row
        $app = DB::table('team_applications')
            ->where('team_id', $teamId)
            ->where('project_id', $projectId)
            ->lockForUpdate()
            ->first();

        if (!$app) return response()->json(['message' => 'Not found'], 404);
        if (strcasecmp($app->status, 'Pending') !== 0) {
            return response()->json(['message' => 'Only pending requests can be updated'], 409);
        }

        if ($validated['status'] === 'Approved') {
            // Lock all rows for this project to avoid races
            DB::table('team_applications')
                ->where('project_id', $projectId)
                ->lockForUpdate()
                ->get();

            // If another one already got approved, block
            $alreadyApproved = DB::table('team_applications')
                ->where('project_id', $projectId)
                ->where('status', 'Approved')
                ->exists();

            if ($alreadyApproved) {
                return response()->json([
                    'message' => 'This project is already approved for another team.'
                ], 409);
            }

            // Approve this app
            DB::table('team_applications')
                ->where('team_id', $teamId)
                ->where('project_id', $projectId)
                ->update(['status' => 'Approved']);

            // 👇 Auto-reject all other pending applications for this project
            DB::table('team_applications')
                ->where('project_id', $projectId)
                ->where('team_id', '!=', $teamId)
                ->where('status', 'Pending')
                ->update(['status' => 'Rejected']);

        } else {
            // Just reject this one
            DB::table('team_applications')
                ->where('team_id', $teamId)
                ->where('project_id', $projectId)
                ->update(['status' => 'Rejected']);
        }

        return response()->json(['ok' => true]);
    });    
}


 public function previousReservedProjects(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user || $user->role !== 'supervisor') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $current = DB::table('semesters')->where('is_current', 1)->first();
            if (!$current) {
                return response()->json(['message' => 'No current semester set.'], 409);
            }

            // optional project limit (if you need it in UI)
            $supRow = DB::table('supervisors')->where('supervisor_id', $user->id)->first();
            $limit  = $supRow ? (int)($supRow->projects_no_limit ?? 0) : null;

            // status set (adjust if you only use one)
            $statusSet = ['reserved', 'Reserved', 'approved', 'Approved'];

            // projects owned by this supervisor, NOT in current semester,
            // and with at least one reserved/approved team_application
            $projects = DB::table('projects')
                ->where('projects.supervisor_id', $user->id)
                ->where('projects.semester_id', '<>', $current->id)
                ->whereExists(function ($q) use ($statusSet) {
                    $q->from('team_applications')
                      ->whereColumn('team_applications.project_id', 'projects.project_id')
                      ->whereIn('team_applications.status', $statusSet);
                })
                ->leftJoin('semesters', 'semesters.id', '=', 'projects.semester_id')
                ->orderBy('projects.title')
                ->get([
                    'projects.project_id as id',
                    'projects.title',
                    'projects.semester_id',
                    'semesters.name as semester_name',
                ]);

            return response()->json([
                'projects_no_limit' => $limit,
                'projects'          => $projects,
            ]);
        } catch (\Throwable $e) {
            Log::error('previousReservedProjects error: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    /**
     * POST /supervisor/projects/{project}/activate
     * Move project + its reserved team to the current semester.
     */
    public function activatePreviousProject(Request $request, $projectId)
{
    try {
        $user = $request->user();
        if (!$user || $user->role !== 'supervisor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $current = DB::table('semesters')->where('is_current', 1)->first();
        if (!$current) {
            return response()->json(['message' => 'No current semester set.'], 409);
        }

        // Accept common variants
        $statusList = ['reserved', 'approved', 'selected', 'accepted'];

        return DB::transaction(function () use ($user, $projectId, $current, $statusList) {
            // Lock project row
            $project = DB::table('projects')
                ->where('project_id', $projectId)
                ->where('supervisor_id', $user->id)
                ->lockForUpdate()
                ->first();

            if (!$project) {
                return response()->json(['message' => 'Project not found.'], 404);
            }
            if ((int)$project->semester_id === (int)$current->id) {
                return response()->json(['message' => 'Project is already in the current semester.'], 409);
            }

            // Pull all candidate applications + team semesters
            $apps = DB::table('team_applications as ta')
                ->join('teams as t', 't.id', '=', 'ta.team_id')
                ->where('ta.project_id', $project->project_id)
                ->whereIn(DB::raw('LOWER(ta.status)'), $statusList)
                ->lockForUpdate()
                ->get([
                    'ta.team_id',
                    'ta.project_id',
                    'ta.status',
                    't.semester_id as team_semester_id',
                ]);

            if ($apps->isEmpty()) {
                return response()->json(['message' => 'No reserved/approved team found for this project.'], 409);
            }

            // Prefer the app whose team semester equals the project's current (old) semester
            $preferred = $apps->firstWhere('team_semester_id', $project->semester_id);
            if (!$preferred) {
                // fallback: choose deterministically by smallest team_id
                $preferred = $apps->sortBy('team_id')->first();
            }

            // Move project to current semester and set number = 2
            DB::table('projects')
                ->where('project_id', $project->project_id)
                ->update([
                    'semester_id' => $current->id,
                    'number'      => 2,
                ]);

            // Move chosen team to current semester
            DB::table('teams')
                ->where('id', $preferred->team_id)
                ->update(['semester_id' => $current->id]);

            return response()->json([
                'message'  => 'Project activated, moved to current semester, and number set to 2.',
                'team_id'  => $preferred->team_id,
            ]);
        });
    } catch (\Throwable $e) {
        \Log::error('activatePreviousProject error: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);
        return response()->json(['message' => 'Server error'], 500);
    }
}

public function projectDetails(Request $request, $projectId)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'supervisor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Basic project info
        $project = DB::table('projects')
            ->where('project_id', $projectId)
            ->select('project_id as id', 'title')
            ->first();

        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        // Find the (reserved/approved) team currently holding this project
        $teamApp = DB::table('team_applications')
            ->where('project_id', $projectId)
            ->whereRaw('LOWER(status) IN (?, ?)', ['reserved', 'approved'])
            ->orderByDesc('status')
            ->first();

        $teamData = ['name' => null, 'code' => null];
        $members = [];

        if ($teamApp) {
            $team = DB::table('teams')->where('id', $teamApp->team_id)->first();
            if ($team) {
                $teamData['name'] = $team->name ?? 'Team';
                // No explicit "code" column in schema → derive a readable code
                $teamData['code'] = sprintf("%05d", $team->id);
            }

            // Team members (join students -> users to get names)
            $memberRows = DB::table('team_members as tm')
                ->join('students as s', 'tm.student_id', '=', 's.student_id')
                ->join('users as u', 's.student_id', '=', 'u.id')
                ->where('tm.team_id', $teamApp->team_id)
                ->select('s.student_id', 'u.name')
                ->get();

            // For each student: final grade = sum(grades)/(count*10)  → e.g., (3+5+7)/30
            $idx = 1;
            foreach ($memberRows as $row) {
                $agg = DB::table('task_submissions')
                    ->where('student_id', $row->student_id)
                    ->selectRaw('COALESCE(SUM(grade),0) as sum_g, COUNT(*) as cnt')
                    ->first();

                $sum = (float) ($agg->sum_g ?? 0);
                $cnt = (int) ($agg->cnt ?? 0);
                $den = max($cnt * 10, 1); // avoid /0
                $percent = $den > 0 ? round(($sum / $den) * 100, 1) : 0.0;

                $members[] = [
                    'index'       => $idx++,
                    'name'        => $row->name,
                    'student_id'  => (string)$row->student_id,
                    // Show as "xx.x%" to keep UI simple & exact to your formula
                    'final_grade' => $percent . '%',
                ];
            }
        }

        // Posts (latest first)
        $posts = DB::table('project_posts as p')
            ->join('users as u', 'p.author_id', '=', 'u.id')
            ->where('p.project_id', $projectId)
            ->orderByDesc('p.timestamp')
            ->select('u.name as author', 'p.content as text', 'p.timestamp')
            ->get()
            ->map(function ($r) {
                // Format to DD/MM/YYYY HH:mm Palestine time
                $ts = Carbon::parse($r->timestamp)->timezone('Asia/Gaza')
                    ->format('d/m/Y H:i');
                return ['author' => $r->author, 'text' => $r->text, 'timestamp' => $ts];
            });

        // Tasks for this project with status:
        // "Graded" if all submissions from team members are graded (no nulls and count == members count when submitted)
        $taskRows = DB::table('project_tasks')
            ->where('project_id', $projectId)
            ->orderBy('deadline', 'asc')
            ->select('id', 'title', 'deadline')
            ->get();

        $memberIds = array_map(fn($m) => (int)$m['student_id'], $members);
        $memberCount = count($memberIds);

        $tasks = [];
        foreach ($taskRows as $t) {
            // submissions only from the team members (if we have a team)
            $subs = DB::table('task_submissions')
                ->where('task_id', $t->id);

            if ($memberCount > 0) {
                $subs->whereIn('student_id', $memberIds);
            }

            $subs = $subs->selectRaw('COUNT(*) as total_subs, SUM(CASE WHEN grade IS NULL THEN 1 ELSE 0 END) as not_graded')->first();

            $status = 'Not graded';
            if ($subs && (int)$subs->total_subs > 0 && (int)$subs->not_graded === 0) {
                $status = 'Graded';
            }

            $tasks[] = [
                'id'          => (string)$t->id,
                'title'       => $t->title,
                'deadline_str'=> Carbon::parse($t->deadline)->timezone('Asia/Gaza')->format('d/m/Y H:i'),
                'status'      => $status,
            ];
        }

        return response()->json([
            'project' => ['id' => (string)$project->id, 'title' => $project->title],
            'team'    => $teamData,
            'members' => $members,
            'posts'   => $posts,
            'tasks'   => $tasks,
        ]);
    }

    // ---------------------------
    // ADD POST
    // ---------------------------
    public function addProjectPost(Request $request, $projectId)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'supervisor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        $now = Carbon::now('Asia/Gaza');

        DB::table('project_posts')->insert([
            'project_id' => (int)$projectId,
            'author_id'  => (int)$user->id,
            'timestamp'  => $now,     // uses columns: project_id, author_id, timestamp, content
            'content'    => $request->input('content'),
        ]);

        return response()->json([
            'author'    => $user->name,
            'text'      => $request->input('content'),
            'timestamp' => $now->format('d/m/Y H:i'),
        ], 201);
    }

    // ---------------------------
    // ADD TASK  (with optional attachments[])
    // "task id = project id + serial" (numeric concatenation) & Palestine time
    // ---------------------------
    public function addProjectTask(Request $request, $projectId)
{
    $user = $request->user();
    if (!$user || $user->role !== 'supervisor') {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    $request->validate([
        'title'         => 'required|string|max:255',
        'deadline'      => 'required|date', // e.g. 2025-01-01T11:59:00
        'description'   => 'nullable|string',
        'attachments.*' => 'file|max:20480', // each <= 20MB (front-end may send multiple)
    ]);

    try {
        // Normalize deadline to UTC (DB keeps DATETIME)
        $deadlineUtc = \Carbon\Carbon::parse(str_replace('T',' ', $request->input('deadline')))
            ->timezone('UTC');

        $nowGaza = \Carbon\Carbon::now('Asia/Gaza');

        // Next serial for this project
        $serial = DB::table('project_tasks')->where('project_id', $projectId)->count() + 1;

        // Concatenate numeric id: {projectId}{serial}
        $customId = (int) ((string)$projectId . (string)$serial);

        // Handle ONE file only (schema: varchar(255))
        $storedPath = null;
        if ($request->hasFile('attachments') && count($request->file('attachments')) > 0) {
            $first = $request->file('attachments')[0];
            $storedPath = $first->store("project_tasks/{$projectId}/{$customId}", 'public'); // e.g. storage/app/public/...
            // Ensure <=255 just in case (Storage paths are typically short, but be safe)
            if (strlen($storedPath) > 255) {
                // fallback: trim tail (rare)
                $storedPath = substr($storedPath, 0, 255);
            }
        }

        DB::table('project_tasks')->insert([
            'id'          => $customId,
            'project_id'  => (int)$projectId,
            'title'       => $request->input('title'),
            'deadline'    => $deadlineUtc,                 // UTC
            'description' => $request->input('description'),
            'file'        => $storedPath,                  // <-- was file_path
            'timestamp'   => \Carbon\Carbon::now('Asia/Gaza'),
        ]);

        // Return refreshed tasks list (same shape your page expects)
        $taskRows = DB::table('project_tasks')
            ->where('project_id', $projectId)
            ->orderBy('deadline', 'asc')
            ->select('id', 'title', 'deadline')
            ->get();

        // Get current team members for status calc
        $teamApp = DB::table('team_applications')
            ->where('project_id', $projectId)
            ->whereRaw('LOWER(status) IN (?, ?)', ['reserved', 'approved'])
            ->first();

        $memberIds = [];
        if ($teamApp) {
            $memberIds = DB::table('team_members')
                ->where('team_id', $teamApp->team_id)
                ->pluck('student_id')->map(fn($x)=>(int)$x)->all();
        }
        $memberCount = count($memberIds);

        $tasks = [];
        foreach ($taskRows as $t) {
            $subsQ = DB::table('task_submissions')->where('task_id', $t->id);
            if ($memberCount > 0) $subsQ->whereIn('student_id', $memberIds);
            $subs = $subsQ->selectRaw('COUNT(*) AS total_subs, SUM(CASE WHEN grade IS NULL THEN 1 ELSE 0 END) AS not_graded')->first();

            $status = 'Not graded';
            if ($subs && (int)$subs->total_subs > 0 && (int)$subs->not_graded === 0) $status = 'Graded';

            $tasks[] = [
                'id'           => (string)$t->id,
                'title'        => $t->title,
                'deadline_str' => \Carbon\Carbon::parse($t->deadline)->timezone('Asia/Gaza')->format('d/m/Y H:i'),
                'status'       => $status,
            ];
        }

        return response()->json(['tasks' => $tasks], 201);

    } catch (\Throwable $e) {
        // Log the real cause; return a safe message
        \Log::error('Add Project Task failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
        return response()->json([
            'message' => 'Failed to add task. Likely cause: file column accepts one path (varchar 255).',
        ], 500);
    }
}

    
}