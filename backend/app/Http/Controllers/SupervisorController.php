<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Semester;
use App\Models\Supervisor;
use App\Models\Project;

class SupervisorController extends Controller
{
    /**
     * GET /api/supervisor/my-projects
     * Returns current supervisor's projects for the current semester
     * + the projects_no_limit from supervisors table.
     */
    public function myProjects(Request $request)
    {
        $user = $request->user();

        // Optional: enforce role
        if (!$user || $user->role !== 'supervisor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Current semester
        $semester = Semester::where('is_current', 1)->first();
        if (!$semester) {
            return response()->json(['message' => 'No current semester set.'], 409);
        }

        // Supervisor record (for projects_no_limit)
        $sup = Supervisor::find($user->id);
        $limit = $sup ? (int)$sup->projects_no_limit : 5;

        // Fetch projects for this supervisor in current semester
        $projects = Project::where('supervisor_id', $user->id)
            ->where('semester_id', $semester->id)
            ->orderBy('title')
            ->get(['project_id as id', 'title']);

        // Optional status flag: mark "Reserved" if an approved team application exists
        // (adjust status value if your app uses different wording)
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
}