<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Entitlement extends Model
{
    protected $guarded = [];
    protected $casts = ['starts_at' => 'datetime', 'ends_at' => 'datetime'];
    public function plan() { return $this->belongsTo(Plan::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function grantedBy() { return $this->belongsTo(User::class, 'granted_by'); }
}
