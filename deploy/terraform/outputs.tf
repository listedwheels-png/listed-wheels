output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC ID in ap-south-1"
}

output "alb_dns_name" {
  value       = aws_lb.main.dns_name
  description = "Application Load Balancer DNS Name"
}

output "rds_endpoint" {
  value       = aws_db_instance.postgres.endpoint
  description = "RDS PostgreSQL connection endpoint"
}

output "public_media_bucket" {
  value       = aws_s3_bucket.public_media.bucket
  description = "Public S3 bucket for vehicle photos"
}

output "cloudfront_domain_name" {
  value       = aws_cloudfront_distribution.media_cdn.domain_name
  description = "CloudFront CDN domain name for media delivery"
}

output "private_documents_bucket" {
  value       = aws_s3_bucket.private_docs.bucket
  description = "Private S3 bucket for encrypted verification documents"
}
