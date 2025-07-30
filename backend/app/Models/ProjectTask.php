<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectTask extends Model
{
    public $incrementing = true;
    protected $primaryKey = 'id';
    public $timestamps = false;
    protected $fillable = ['project_id', 'title', 'deadline', 'description'];

    public function project()
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function submissions()
    {
        return $this->hasMany(TaskSubmission::class, 'task_id');
    }
}
