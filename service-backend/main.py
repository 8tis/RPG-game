import math
import subprocess
from datetime import datetime, timedelta
from typing import Optional, List

import bcrypt
import jwt
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException, Header, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

SECRET_KEY = "rpg_secret_jwt_key_2026_infinity_game"
ALGORITHM = "HS256"
ADMIN_KEY = "rpg_admin_infinity_2026_secret"

app = FastAPI(title="RPG Auth & Points Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    host = "172.19.0.2"
    try:
        ip = subprocess.check_output(
            ["docker", "inspect", "-f", "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}", "docker-db_postgres-1"],
            stderr=subprocess.DEVNULL
        ).decode().strip()
        if ip:
            host = ip
    except Exception:
        pass
    return psycopg2.connect(
        host=host,
        port=5432,
        user="postgres",
        password="difyai123456",
        dbname="dify"
    )

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(user_id: int, username: str) -> str:
    expire = datetime.utcnow() + timedelta(days=30)
    payload = {
        "sub": str(user_id),
        "username": username,
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="未提供有效身份凭证")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="身份凭证已过期或无效")

    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id, username, points, total_tokens_consumed, status, is_admin, created_at FROM rpg_users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            if not user:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户不存在")
            if user["status"] == "banned":
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="账号已被封禁")
            return dict(user)
    finally:
        conn.close()

def require_admin(x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key")):
    if not x_admin_key or x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无管理员权限或秘钥错误")
    return True

# --- Request / Response Models ---
class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=32)
    password: str = Field(..., min_length=6, max_length=64)

class LoginRequest(BaseModel):
    username: str
    password: str

class DeductRequest(BaseModel):
    tokens: int = Field(..., ge=0)
    remark: Optional[str] = None

class AdminAdjustRequest(BaseModel):
    user_id: int
    points_change: int
    remark: Optional[str] = "管理员调账"

class AdminStatusRequest(BaseModel):
    user_id: int
    status: str

# --- Endpoints ---

@app.get("/health")
def health():
    return {"status": "ok", "service": "rpg-auth-service", "timestamp": datetime.utcnow().isoformat()}

@app.post("/api/auth/register")
def register(req: RegisterRequest):
    username = req.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="用户名不能为空")

    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id FROM rpg_users WHERE LOWER(username) = LOWER(%s)", (username,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="该代号已被其他轮回者使用")

            pw_hash = hash_password(req.password)
            cur.execute(
                """
                INSERT INTO rpg_users (username, password_hash, points, total_tokens_consumed, status, is_admin)
                VALUES (%s, %s, 2000, 0, 'active', FALSE)
                RETURNING id, username, points, total_tokens_consumed, status, is_admin, created_at
                """,
                (username, pw_hash)
            )
            new_user = cur.fetchone()
            user_id = new_user["id"]

            cur.execute(
                """
                INSERT INTO rpg_points_logs (user_id, change_type, points_change, tokens_consumed, balance_after, remark)
                VALUES (%s, 'initial_bonus', 2000, 0, 2000, '主神空间新人补给包')
                """,
                (user_id,)
            )
            conn.commit()

            token = create_access_token(user_id, username)
            return {
                "code": 0,
                "msg": "注册成功",
                "data": {
                    "token": token,
                    "user": {
                        "id": new_user["id"],
                        "username": new_user["username"],
                        "points": new_user["points"],
                        "total_tokens_consumed": new_user["total_tokens_consumed"],
                        "status": new_user["status"],
                        "is_admin": new_user["is_admin"],
                        "created_at": new_user["created_at"].isoformat() if new_user["created_at"] else None
                    }
                }
            }
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"注册服务异常: {str(e)}")
    finally:
        conn.close()

@app.post("/api/auth/login")
def login(req: LoginRequest):
    username = req.username.strip()
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT id, username, password_hash, points, total_tokens_consumed, status, is_admin, created_at FROM rpg_users WHERE LOWER(username) = LOWER(%s)",
                (username,)
            )
            user = cur.fetchone()
            if not user:
                raise HTTPException(status_code=400, detail="代号或密码错误")

            if not verify_password(req.password, user["password_hash"]):
                raise HTTPException(status_code=400, detail="代号或密码错误")

            if user["status"] == "banned":
                raise HTTPException(status_code=403, detail="该轮回者已被主神空间抹杀/封禁")

            token = create_access_token(user["id"], user["username"])
            return {
                "code": 0,
                "msg": "登入成功",
                "data": {
                    "token": token,
                    "user": {
                        "id": user["id"],
                        "username": user["username"],
                        "points": user["points"],
                        "total_tokens_consumed": user["total_tokens_consumed"],
                        "status": user["status"],
                        "is_admin": user["is_admin"],
                        "created_at": user["created_at"].isoformat() if user["created_at"] else None
                    }
                }
            }
    finally:
        conn.close()

@app.get("/api/user/profile")
def profile(current_user: dict = Depends(get_current_user)):
    return {
        "code": 0,
        "data": {
            "id": current_user["id"],
            "username": current_user["username"],
            "points": current_user["points"],
            "total_tokens_consumed": current_user["total_tokens_consumed"],
            "status": current_user["status"],
            "is_admin": current_user["is_admin"],
            "created_at": current_user["created_at"].isoformat() if current_user["created_at"] else None
        }
    }

@app.get("/api/user/logs")
def user_logs(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        offset = (page - 1) * page_size
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, change_type, points_change, tokens_consumed, balance_after, remark, created_at
                FROM rpg_points_logs
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
                """,
                (current_user["id"], page_size, offset)
            )
            logs = cur.fetchall()
            for l in logs:
                if l["created_at"]:
                    l["created_at"] = l["created_at"].isoformat()
            return {"code": 0, "data": logs}
    finally:
        conn.close()

@app.post("/api/user/deduct-points")
def deduct_points(req: DeductRequest, current_user: dict = Depends(get_current_user)):
    tokens = req.tokens
    # 1000 tokens = 1 point, ceil to next point if > 0
    points_to_deduct = math.ceil(tokens / 1000) if tokens > 0 else 0

    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT points, total_tokens_consumed, status FROM rpg_users WHERE id = %s FOR UPDATE", (current_user["id"],))
            user = cur.fetchone()
            if not user or user["status"] == "banned":
                raise HTTPException(status_code=403, detail="账号不可用")

            curr_points = user["points"]
            curr_tokens = user["total_tokens_consumed"]

            new_points = max(0, curr_points - points_to_deduct)
            new_tokens = curr_tokens + tokens

            cur.execute(
                "UPDATE rpg_users SET points = %s, total_tokens_consumed = %s, updated_at = NOW() WHERE id = %s",
                (new_points, new_tokens, current_user["id"])
            )

            remark = req.remark or f"位面推演消耗 (Token: {tokens})"
            cur.execute(
                """
                INSERT INTO rpg_points_logs (user_id, change_type, points_change, tokens_consumed, balance_after, remark)
                VALUES (%s, 'chat_consumption', %s, %s, %s, %s)
                """,
                (current_user["id"], -points_to_deduct, tokens, new_points, remark)
            )
            conn.commit()

            return {
                "code": 0,
                "msg": "扣减成功",
                "data": {
                    "points_deducted": points_to_deduct,
                    "remaining_points": new_points,
                    "total_tokens_consumed": new_tokens
                }
            }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"扣除积分异常: {str(e)}")
    finally:
        conn.close()

# --- Admin API ---

@app.post("/api/admin/verify")
def admin_verify(x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key")):
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="管理员秘钥错误")
    return {"code": 0, "msg": "验证通过"}

@app.get("/api/admin/stats")
def admin_stats(_: bool = Depends(require_admin)):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT COUNT(*) as total_users, COALESCE(SUM(points), 0) as total_points, COALESCE(SUM(total_tokens_consumed), 0) as total_tokens FROM rpg_users")
            stats = cur.fetchone()
            return {"code": 0, "data": stats}
    finally:
        conn.close()

@app.get("/api/admin/users")
def admin_users(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    _: bool = Depends(require_admin)
):
    conn = get_db_connection()
    try:
        offset = (page - 1) * page_size
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            base_sql = "FROM rpg_users"
            params = []
            if search:
                base_sql += " WHERE username ILIKE %s"
                params.append(f"%{search}%")

            cur.execute(f"SELECT COUNT(*) as count {base_sql}", params)
            total = cur.fetchone()["count"]

            cur.execute(
                f"""
                SELECT id, username, points, total_tokens_consumed, status, is_admin, created_at, updated_at
                {base_sql}
                ORDER BY id DESC
                LIMIT %s OFFSET %s
                """,
                params + [page_size, offset]
            )
            users = cur.fetchall()
            for u in users:
                if u["created_at"]:
                    u["created_at"] = u["created_at"].isoformat()
                if u["updated_at"]:
                    u["updated_at"] = u["updated_at"].isoformat()

            return {
                "code": 0,
                "data": {
                    "total": total,
                    "page": page,
                    "page_size": page_size,
                    "users": users
                }
            }
    finally:
        conn.close()

@app.post("/api/admin/adjust-points")
def admin_adjust_points(req: AdminAdjustRequest, _: bool = Depends(require_admin)):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id, username, points FROM rpg_users WHERE id = %s FOR UPDATE", (req.user_id,))
            user = cur.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="未找到该用户")

            curr_points = user["points"]
            new_points = max(0, curr_points + req.points_change)

            cur.execute("UPDATE rpg_users SET points = %s, updated_at = NOW() WHERE id = %s", (new_points, req.user_id))
            cur.execute(
                """
                INSERT INTO rpg_points_logs (user_id, change_type, points_change, tokens_consumed, balance_after, remark)
                VALUES (%s, 'admin_adjustment', %s, 0, %s, %s)
                """,
                (req.user_id, req.points_change, new_points, req.remark or "主神空间管理调配")
            )
            conn.commit()
            return {
                "code": 0,
                "msg": "调整成功",
                "data": {
                    "user_id": req.user_id,
                    "points_change": req.points_change,
                    "balance_after": new_points
                }
            }
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/admin/update-status")
def admin_update_status(req: AdminStatusRequest, _: bool = Depends(require_admin)):
    if req.status not in ("active", "banned"):
        raise HTTPException(status_code=400, detail="非法状态值")
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("UPDATE rpg_users SET status = %s, updated_at = NOW() WHERE id = %s RETURNING id, username, status", (req.status, req.user_id))
            updated = cur.fetchone()
            if not updated:
                raise HTTPException(status_code=404, detail="用户不存在")
            conn.commit()
            return {"code": 0, "msg": "状态已更新", "data": updated}
    finally:
        conn.close()

@app.get("/api/admin/user-logs")
def admin_user_logs(user_id: int = Query(...), page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=100), _: bool = Depends(require_admin)):
    conn = get_db_connection()
    try:
        offset = (page - 1) * page_size
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, user_id, change_type, points_change, tokens_consumed, balance_after, remark, created_at
                FROM rpg_points_logs
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
                """,
                (user_id, page_size, offset)
            )
            logs = cur.fetchall()
            for l in logs:
                if l["created_at"]:
                    l["created_at"] = l["created_at"].isoformat()
            return {"code": 0, "data": logs}
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5005)
