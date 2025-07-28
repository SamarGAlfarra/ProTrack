<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// Team.php
class Team extends Model
{
    public $incrementing = false;
    protected $primaryKey = 'id';
    public $timestamps = false;
    protected $fillable = ['id','name', 'team_admin', 'semester_id', 'members_limit'];

    public function semester()
    {
        return $this->belongsTo(Semester::class, 'semester_id');
    }

    public function admin()
    {
        return $this->belongsTo(Student::class, 'team_admin');
    }

    public function members()
    {
        return $this->hasMany(TeamMember::class, 'team_id');
    }

    public function applications()
    {
        return $this->hasMany(TeamApplication::class, 'team_id');
    }
}