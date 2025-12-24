#!/usr/bin/env python3
"""
SQLite 到 PostgreSQL 数据迁移脚本
只迁移数据，保留 EF Core 创建的 schema
自动处理列差异和类型转换
"""
import sqlite3
import psycopg2

# 连接配置
SQLITE_PATH = '/Volumes/fanxiang/MyTechBlog/data/blog.db'
PG_CONFIG = {
    'host': 'localhost',
    'port': 5433,
    'database': 'my_blog',
    'user': 'blog_admin',
    'password': 'MySecureBlogDB2024!'
}

# 表映射：按依赖顺序
TABLES = [
    'Categories', 'Tags', 'Series', 'Users', 'UserProfiles',
    'Posts', 'Comments', 'ImageAssets', 'PostLikes', 'PostTag'
]

# 布尔列列表（SQLite 用 0/1，PostgreSQL 用 boolean）
BOOLEAN_COLUMNS = {'IsHidden', 'IsApproved'}

def get_pg_columns(pg_cursor, table_name):
    """获取 PostgreSQL 表的列名"""
    pg_cursor.execute("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = %s ORDER BY ordinal_position
    """, (table_name,))
    return [row[0] for row in pg_cursor.fetchall()]

def convert_value(col_name, value):
    """转换值类型"""
    if value is None:
        return None
    if col_name in BOOLEAN_COLUMNS:
        return bool(value)  # 0 -> False, 1 -> True
    return value

def migrate():
    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    pg_conn = psycopg2.connect(**PG_CONFIG)
    pg_cursor = pg_conn.cursor()
    
    # 禁用外键检查
    pg_cursor.execute("SET session_replication_role = 'replica';")
    
    for table in TABLES:
        print(f"Migrating {table}...")
        
        # 获取 PostgreSQL 表的列（目标列）
        pg_columns = get_pg_columns(pg_cursor, table)
        if not pg_columns:
            print(f"  WARNING: Table {table} not found in PostgreSQL")
            continue
        
        # 获取 SQLite 数据
        sqlite_cursor = sqlite_conn.cursor()
        sqlite_cursor.execute(f"SELECT * FROM {table}")
        rows = sqlite_cursor.fetchall()
        
        if not rows:
            print(f"  No data in {table}")
            continue
        
        # 获取 SQLite 列名
        sqlite_columns = [desc[0] for desc in sqlite_cursor.description]
        
        # 只使用两边都存在的列
        common_columns = [col for col in pg_columns if col in sqlite_columns]
        
        if len(common_columns) < len(sqlite_columns):
            extra = set(sqlite_columns) - set(common_columns)
            print(f"  Skipping SQLite-only columns: {extra}")
        
        # 清空目标表
        pg_cursor.execute(f'TRUNCATE "{table}" CASCADE;')
        
        # 构建 INSERT 语句
        pg_col_str = ', '.join([f'"{c}"' for c in common_columns])
        placeholders = ', '.join(['%s'] * len(common_columns))
        insert_sql = f'INSERT INTO "{table}" ({pg_col_str}) VALUES ({placeholders})'
        
        # 获取列索引
        col_indices = [sqlite_columns.index(c) for c in common_columns]
        
        count = 0
        for row in rows:
            # 转换值（处理布尔类型等）
            values = tuple(
                convert_value(common_columns[i], row[col_indices[i]]) 
                for i in range(len(common_columns))
            )
            pg_cursor.execute(insert_sql, values)
            count += 1
        
        print(f"  ✅ Migrated {count} rows")
    
    # 恢复外键检查
    pg_cursor.execute("SET session_replication_role = 'origin';")
    
    # 重置序列
    print("\nResetting sequences...")
    for table in TABLES:
        if table == 'PostTag':  # 没有 Id 列
            continue
        try:
            pg_cursor.execute(f'''
                SELECT setval(pg_get_serial_sequence('"{table}"', 'Id'), 
                       coalesce(max("Id"), 0) + 1, false) FROM "{table}";
            ''')
        except Exception as e:
            print(f"  Warning: {table} sequence - {e}")
    
    pg_conn.commit()
    
    # 验证数据
    print("\n📊 Data verification:")
    for table in TABLES:
        pg_cursor.execute(f'SELECT COUNT(*) FROM "{table}"')
        count = pg_cursor.fetchone()[0]
        print(f"  {table}: {count} rows")
    
    print("\n✅ Migration complete!")
    
    sqlite_conn.close()
    pg_conn.close()

if __name__ == '__main__':
    migrate()
