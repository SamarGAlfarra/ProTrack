<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use LaravelTreats\Model\Traits\HasCompositePrimaryKey;

class TeamApplication extends Model
{
    use HasCompositePrimaryKey;

    protected $table = 'team_applications';
    protected $primaryKey = ['team_id', 'project_id'];
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = ['team_id', 'project_id', 'status'];

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class, 'project_id');
    }
}


