<?php
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MemberController;
use Illuminate\Support\Facades\Route;

Route::post('register', [AuthController::class, 'register'])->middleware('throttle:6,1');
Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');

// Signed, short-lived link issued by /titles/{title}/download
Route::get('files/{event}', [MemberController::class, 'file'])->name('download.file')->middleware(['signed', 'throttle:30,1']);

Route::middleware(['auth:sanctum', 'role:any'])->group(function () {
    // Member (and admin) endpoints
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [MemberController::class, 'me']);
    Route::get('library', [MemberController::class, 'library']);
    Route::get('history', [MemberController::class, 'history']);
    Route::post('titles/{title}/download', [MemberController::class, 'download'])->middleware('throttle:20,1');

    // Owner / admin only
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        Route::get('stats', [AdminController::class, 'stats']);
        Route::get('users', [AdminController::class, 'users']);
        Route::get('users/{user}', [AdminController::class, 'user']);
        Route::put('users/{user}/plan', [AdminController::class, 'setPlan']);
        Route::put('users/{user}/status', [AdminController::class, 'setStatus']);
        Route::get('titles', [AdminController::class, 'titles']);
        Route::post('titles', [AdminController::class, 'storeTitle']);
        Route::put('titles/{title}', [AdminController::class, 'updateTitle']);
        Route::get('plans', [AdminController::class, 'plans']);
        Route::put('plans/{plan}/titles', [AdminController::class, 'syncPlanTitles']);
        Route::get('audit', [AdminController::class, 'audit']);
    });
});
