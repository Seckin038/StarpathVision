export const cfg = {
  s3: {
    endpoint: process.env.S3_ENDPOINT!,
    bucket: process.env.S3_BUCKET!,
    accessKey: process.env.S3_ACCESS_KEY!,
    secretKey: process.env.S3_SECRET_KEY!,
  },
  db: {
    url: process.env.DATABASE_URL!,
  },
  smtp: {
    host: process.env.SMTP_HOST!,
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
};

