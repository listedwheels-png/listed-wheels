variable "aws_region" {
  type        = string
  default     = "ap-south-1"
  description = "AWS Region (Mumbai, India)"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Deployment environment (production, staging)"
}

variable "vpc_cidr" {
  type        = string
  default     = "10.0.0.0/16"
  description = "VPC CIDR block"
}

variable "domain_name" {
  type        = string
  default     = "listedwheels.in"
  description = "Primary apex domain name"
}

variable "db_instance_class" {
  type        = string
  default     = "db.t4g.medium"
  description = "RDS PostgreSQL instance class"
}

variable "db_name" {
  type        = string
  default     = "listedwheels_db"
  description = "RDS database name"
}

variable "db_username" {
  type        = string
  default     = "listedwheels_admin"
  description = "RDS master username"
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "RDS master password"
}

variable "backend_cpu" {
  type        = number
  default     = 512
  description = "Fargate CPU units for FastAPI backend (512 = 0.5 vCPU)"
}

variable "backend_memory" {
  type        = number
  default     = 1024
  description = "Fargate memory for FastAPI backend in MB"
}

variable "frontend_cpu" {
  type        = number
  default     = 512
  description = "Fargate CPU units for Next.js frontend"
}

variable "frontend_memory" {
  type        = number
  default     = 1024
  description = "Fargate memory for Next.js frontend in MB"
}
