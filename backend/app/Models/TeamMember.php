<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use LaravelTreats\Model\Traits\HasCompositePrimaryKey;

// TeamMember.php
class TeamMember extends Model
{
    use HasCompositePrimaryKey;

    protected $primaryKey = ['team_id', 'student_id'];
    public $incrementing = false;
    public $timestamps = false;
    protected $table = 'team_members';
    protected $fillable = ['team_id','student_id', 'is_approved', 'is_admin'];

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
}
