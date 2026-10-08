# -----------------------------------------------------------------------------
# Dual S3 Storage & CloudFront CDN
# -----------------------------------------------------------------------------

# 1. Public Media Bucket (Vehicle Photos served via CloudFront)
resource "aws_s3_bucket" "public_media" {
  bucket = "listedwheels-media-public-${var.environment}"

  tags = {
    Name        = "listedwheels-media-public"
    AccessLevel = "CloudFront-OAC"
  }
}

resource "aws_s3_bucket_cors_configuration" "public_media_cors" {
  bucket = aws_s3_bucket.public_media.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST", "GET"]
    allowed_origins = ["https://${var.domain_name}", "http://localhost:3000"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_cloudfront_origin_access_control" "media_oac" {
  name                              = "listedwheels-media-oac"
  description                       = "OAC for ListedWheels public vehicle media S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "media_cdn" {
  origin {
    domain_name              = aws_s3_bucket.public_media.bucket_regional_domain_name
    origin_id                = "S3-listedwheels-media"
    origin_access_control_id = aws_cloudfront_origin_access_control.media_oac.id
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront CDN for ListedWheels vehicle photos"
  default_root_object = ""

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-listedwheels-media"

    forwarded_values {
      query_string = false
      headers      = ["Origin"]

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400    # 24 hours
    max_ttl                = 31536000 # 1 year
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "listedwheels-media-cdn"
  }
}

resource "aws_s3_bucket_policy" "public_media_policy" {
  bucket = aws_s3_bucket.public_media.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipalReadOnly"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.public_media.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.media_cdn.arn
          }
        }
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# 2. Private Document Vault Bucket (RC Copies, Aadhaar, Dealer Proof)
# -----------------------------------------------------------------------------

resource "aws_kms_key" "s3_docs" {
  description             = "KMS key for private seller verification documents bucket"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name = "listedwheels-docs-kms"
  }
}

resource "aws_s3_bucket" "private_docs" {
  bucket = "listedwheels-docs-private-${var.environment}"

  tags = {
    Name        = "listedwheels-docs-private"
    AccessLevel = "Strictly-Private-ZeroPublic"
  }
}

# Block 100% of public access on the document bucket
resource "aws_s3_bucket_public_access_block" "private_docs_block" {
  bucket = aws_s3_bucket.private_docs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "private_docs_encryption" {
  bucket = aws_s3_bucket.private_docs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_docs.arn
      sse_algorithm     = "aws:kms"
    }
  }
}
