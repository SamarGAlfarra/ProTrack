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


}