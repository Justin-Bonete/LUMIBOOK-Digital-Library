<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Order extends Model
{
    protected $guarded = [];
    protected $casts = ['paid_at' => 'datetime'];
    public function plan() { return $this->belongsTo(Plan::class); }
    public function payments() { return $this->hasMany(Payment::class); }
}
