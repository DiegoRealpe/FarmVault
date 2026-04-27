import sys
from awsglue.context import GlueContext
from awsglue.job import Job
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from pyspark.sql.functions import (
    coalesce,
    col,
    dayofmonth,
    lit,
    month,
    to_timestamp,
    when,
    year,
)

# ------------------------------------------------------------------
# Expected job arguments:
#   --JOB_NAME
#   --RAW_S3_PATH      e.g. s3://your-bucket/raw/
#   --PARQUET_S3_PATH  e.g. s3://your-bucket/parquet/
# ------------------------------------------------------------------

args = getResolvedOptions(
    sys.argv,
    [
        "JOB_NAME",
        "RAW_S3_PATH",
        "PARQUET_S3_PATH",
    ],
)

RAW_S3_PATH = args["RAW_S3_PATH"]
PARQUET_S3_PATH = args["PARQUET_S3_PATH"]

sc = SparkContext()
glue_context = GlueContext(sc)
spark = glue_context.spark_session

job = Job(glue_context)
job.init(args["JOB_NAME"], args)

print(f"[INFO] Reading JSON from: {RAW_S3_PATH}")

raw_df = (
    spark.read
    .option("multiLine", "true")
    .json(RAW_S3_PATH)
)

print("[INFO] Raw input schema:")
raw_df.printSchema()

print("[INFO] Raw sample rows:")
raw_df.show(10, truncate=False)

if len(raw_df.columns) == 0:
    raise Exception(
        f"No columns were read from RAW_S3_PATH={RAW_S3_PATH}. "
        "Check that the path contains valid JSON files and that top-level arrays are being parsed with multiLine=true."
    )

# ------------------------------------------------------------------
# Normalize raw telemetry JSON into Athena-ready Parquet shape:
#
# device_id       string
# application_id  string
# gateway_id      string
# metric_type     string
# value           double
# timestamp       timestamp
#
# partitions:
# year, month, day
# ------------------------------------------------------------------

df = (
    raw_df
    .withColumn("parsed_timestamp", to_timestamp(col("timestamp")))
    .withColumn(
        "metric_type",
        when(col("payload.temperature").isNotNull(), lit("TEMP"))
        .when(col("payload.moisture").isNotNull(), lit("MOISTURE"))
        .otherwise(lit("UNKNOWN")),
    )
    .withColumn(
        "value",
        coalesce(
            col("payload.temperature").cast("double"),
            col("payload.moisture").cast("double"),
        ),
    )
    .select(
        col("device_id").cast("string"),
        col("application_id").cast("string"),
        col("gateway_id").cast("string"),
        col("metric_type").cast("string"),
        col("value").cast("double"),
        col("parsed_timestamp").alias("timestamp"),
    )
    .filter(col("device_id").isNotNull())
    .filter(col("timestamp").isNotNull())
    .filter(col("value").isNotNull())
    .filter(col("metric_type") != "UNKNOWN")
)

df = (
    df
    .withColumn("year", year(col("timestamp")).cast("string"))
    .withColumn("month", month(col("timestamp")).cast("string"))
    .withColumn("day", dayofmonth(col("timestamp")).cast("string"))
)

print("[INFO] Normalized output schema:")
df.printSchema()

print("[INFO] Normalized sample rows:")
df.show(10, truncate=False)

print(f"[INFO] Writing partitioned Parquet to: {PARQUET_S3_PATH}")

(
    df.write
    .mode("overwrite")
    .format("parquet")
    .partitionBy("year", "month", "day")
    .save(PARQUET_S3_PATH)
)

print("[INFO] Parquet write complete.")

job.commit()