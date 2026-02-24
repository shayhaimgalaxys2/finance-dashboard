import { NextRequest, NextResponse } from "next/server";
import {
  isSetup,
  setMasterPassword,
  verifyMasterPassword,
  createSession,
  validateSession,
} from "@/lib/auth";

// GET: Check if setup (master password exists) and if current session is valid
export async function GET(request: NextRequest) {
  try {
    const setupDone = await isSetup();
    const session = await validateSession(request);

    return NextResponse.json({
      isSetup: setupDone,
      isAuthenticated: session.valid,
    });
  } catch (error) {
    console.error("Auth GET error:", error);
    return NextResponse.json(
      { error: "שגיאה בבדיקת הזדהות" },
      { status: 500 }
    );
  }
}

// POST: Login with master password, returns session token in cookie
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "סיסמה נדרשת" },
        { status: 400 }
      );
    }

    const setupDone = await isSetup();
    if (!setupDone) {
      return NextResponse.json(
        { error: "המערכת לא הוגדרה עדיין. יש להגדיר סיסמת מאסטר." },
        { status: 400 }
      );
    }

    const valid = await verifyMasterPassword(password);
    if (!valid) {
      return NextResponse.json(
        { error: "סיסמה שגויה" },
        { status: 401 }
      );
    }

    const token = createSession(password);

    const response = NextResponse.json({
      success: true,
      message: "התחברת בהצלחה",
    });

    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Auth POST error:", error);
    return NextResponse.json(
      { error: "שגיאה בהתחברות" },
      { status: 500 }
    );
  }
}

// PUT: Set initial master password (only if not already set)
export async function PUT(request: NextRequest) {
  try {
    const setupDone = await isSetup();
    if (setupDone) {
      return NextResponse.json(
        { error: "סיסמת מאסטר כבר הוגדרה" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "סיסמה חייבת להכיל לפחות 6 תווים" },
        { status: 400 }
      );
    }

    await setMasterPassword(password);

    // Auto-login after setup
    const token = createSession(password);

    const response = NextResponse.json({
      success: true,
      message: "סיסמת מאסטר הוגדרה בהצלחה",
    });

    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Auth PUT error:", error);
    return NextResponse.json(
      { error: "שגיאה בהגדרת סיסמה" },
      { status: 500 }
    );
  }
}
