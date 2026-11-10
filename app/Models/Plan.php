<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Plan extends Model
{
    protected $guarded = [];
    public function titles() { return $this->belongsToMany(Title::class, 'plan_titles')->withPivot('sort_order'); }
}
