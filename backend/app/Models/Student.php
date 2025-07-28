<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    protected $primaryKey = 'student_id';
    public $incrementing = false;
    public $timestamps = false;

    public function user()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function teamMemberships()
    {
        return $this->hasMany(TeamMember::class, 'student_id');
    }

    public function teamadmins()
    {
        return $this->hasMany(Team::class, 'team_admin');
    }

    public function taskSubmissions()
    {
        return $this->hasMany(TaskSubmission::class, 'student_id');
    }
}

