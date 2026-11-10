<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $r)
    {
        $data = $r->validate([
            'name' => 'required|string|max:120',
            'email' => 'required|email|max:190|unique:users',
            'password' => ['required', 'confirmed', Password::min(10)->mixedCase()->numbers()],
        ]);
        // Public sign-up can only ever create members; admins are seeded/promoted by the owner.
        $user = User::create($data + ['role' => 'member', 'status' => 'active']);
        // TODO: implement MustVerifyEmail and event(new Registered($user)) for email verification.
        return response()->json(['token' => $user->createToken('web')->plainTextToken, 'user' => $user], 201);
    }

    public function login(Request $r)
    {
        $r->validate(['email' => 'required|email', 'password' => 'required']);
        abort_unless(Auth::attempt($r->only('email', 'password')), 422, 'Invalid credentials.');
        $user = Auth::user();
        abort_if($user->status !== 'active', 403, 'This account is suspended.');
        return ['token' => $user->createToken('web')->plainTextToken, 'user' => $user];
    }

    public function logout(Request $r)
    {
        $r->user()->currentAccessToken()->delete();
        return response()->noContent();
    }
}
