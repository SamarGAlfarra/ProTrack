<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Semester extends Model
{
    public $incrementing = false;
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = ['id','name'];

    public function teams()
    {
        return $this->hasMany(Team::class, 'semester_id');
    }

    public function projects()
    {
        return $this->hasMany(Project::class, 'semester_id');
    }
}

