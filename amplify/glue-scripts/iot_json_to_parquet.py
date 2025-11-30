import sys
from awsglue.context import GlueContext
from awsglue.job import Job
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from pyspark.sql import Row
from pyspark.sql.functions import col, to_timestamp, year, month, dayofmonth

# ------------------------------------------------------------------
# Expected job arguments:
#   --JOB_NAME         (automatically provided by Glue)
#   --RAW_S3_PATH      e.g. s3://your-bucket/raw/
#   --PARQUET_S3_PATH  e.g. s3://your-bucket/parquet/
# ------------------------------------------------------------------

args = getResolvedOptions(
    sys.argv,
    [
        "JOB_NAME", 
        # "RAW_S3_PATH", 
        "PARQUET_S3_PATH"
    ],
)

# RAW_S3_PATH = args["RAW_S3_PATH"]
PARQUET_S3_PATH = args["PARQUET_S3_PATH"]

sc = SparkContext()
glue_context = GlueContext(sc)
spark = glue_context.spark_session

job = Job(glue_context)
job.init(args["JOB_NAME"], args)

# print(f"Reading JSON from: {RAW_S3_PATH}")

# # Read JSON as a DynamicFrame from S3
# raw_dyf = glue_context.create_dynamic_frame_from_options(
#     connection_type="s3",
#     connection_options={"paths": [RAW_S3_PATH]},
#     format="json",
# )

# Convert to Spark DataFrame for easier transformations
# df = raw_dyf.toDF()

# Optional: sanity print of schema
# print("Input schema:")
# df.printSchema()

# ------------------------------------------------------------------
# 1) Create a tiny in-memory dataset (one test row)
# ------------------------------------------------------------------

test_row = Row(
    id="TEST-0001",
    payload="dummy-payload",
    moisture=100,
    timestamp="2024-03-15T20:55:27.966Z",  # ISO-8601-style string
    application_id="lorasensor01",
    device_id="eui-2cf7f1c04230026a",
    gateway_id="eui-e45f01fffec5bcf",
)

df = spark.createDataFrame([test_row])

# ------------------------------------------------------------------
# 2) Turn the string timestamp into a proper Spark timestamp
#    (while keeping the original column if you want)
# ------------------------------------------------------------------

df = df.withColumn(
    "event_ts",
    to_timestamp(df["timestamp"], "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
)

print("[INFO] Schema of test DataFrame:")
df.printSchema()

print("[INFO] Sample row:")
df.show(truncate=False)

# ------------------------------------------------------------------
# 3) Write it to S3 as a single Parquet dataset (no partitioning)
# ------------------------------------------------------------------

(
    df.write
      .mode("overwrite")          # for testing; change to "append" later
      .format("parquet")
      .save(PARQUET_S3_PATH)
)

print("[INFO] Test write complete.")

job.commit()
