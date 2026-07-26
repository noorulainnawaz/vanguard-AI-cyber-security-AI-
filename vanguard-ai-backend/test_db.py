import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DIRECT_URL")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT NOW();"))
        for row in result:
            print("✅ Database Connected! Current time:", row[0])
except Exception as e:
    print("❌ ERROR:", e)