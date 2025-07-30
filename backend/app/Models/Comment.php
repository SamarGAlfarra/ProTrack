<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use LaravelTreats\Model\Traits\HasCompositePrimaryKey;

class Comment extends Model
{
    use HasCompositePrimaryKey;

    protected $table = 'comments';
    protected $primaryKey = ['task_id', 'student_id', 'author_id', 'timestamp'];
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = ['task_id', 'student_id', 'author_id', 'timestamp', 'comment'];

    public function taskSubmission()
    {
        return $this->belongsTo(TaskSubmission::class, ['task_id', 'student_id']);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}

