<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    public $incrementing = false;
    protected $primaryKey = 'project_id';
    public $timestamps = false;
    protected $fillable = ['project_id','supervisor_id', 'title', 'meeting_time', 'meeting_link', 'summary', 'file_path', 'semester_id', 'number'];

    public function supervisor()
    {
        return $this->belongsTo(Supervisor::class, 'supervisor_id');
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class, 'semester_id');
    }

    public function posts()
    {
        return $this->hasMany(ProjectPost::class, 'project_id');
    }

    public function tasks()
    {
        return $this->hasMany(ProjectTask::class, 'project_id');
    }

    public function applications()
    {
        return $this->hasMany(TeamApplication::class, 'project_id');
    }
}
