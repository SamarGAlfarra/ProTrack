<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use LaravelTreats\Model\Traits\HasCompositePrimaryKey;

class TaskSubmission extends Model
{
    use HasCompositePrimaryKey;

    protected $table = 'task_submissions';
    protected $primaryKey = ['task_id', 'student_id'];
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = ['task_id', 'student_id', 'file_path', 'grade', 'timestamp'];

    public function task()
    {
        return $this->belongsTo(ProjectTask::class, 'task_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class, ['task_id', 'student_id']);
    }
}
