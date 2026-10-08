# -----------------------------------------------------------------------------
# RDS PostgreSQL 16 (Multi-AZ in Private Subnets)
# -----------------------------------------------------------------------------

resource "aws_db_subnet_group" "rds" {
  name       = "listedwheels-db-subnet-${var.environment}"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]

  tags = {
    Name = "listedwheels-db-subnet-group"
  }
}

resource "aws_security_group" "rds" {
  name        = "listedwheels-rds-sg-${var.environment}"
  description = "Allow inbound PostgreSQL traffic from ECS backend containers"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from ECS backend"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_backend.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "listedwheels-rds-sg"
  }
}

resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS database storage encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name = "listedwheels-rds-kms"
  }
}

resource "aws_db_instance" "postgres" {
  identifier        = "listedwheels-postgres-${var.environment}"
  engine            = "postgres"
  engine_version    = "16.2"
  instance_class    = var.db_instance_class
  allocated_storage = 20
  max_allocated_storage = 100
  storage_type      = "gp3"
  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 5432

  multi_az               = var.environment == "production" ? true : false
  db_subnet_group_name   = aws_db_subnet_group.rds.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period   = 7
  backup_window             = "21:00-22:00" # 2:30 AM - 3:30 AM IST
  maintenance_window        = "Sun:22:00-Sun:23:00"
  auto_minor_version_upgrade = true
  copy_tags_to_snapshot     = true
  deletion_protection       = var.environment == "production" ? true : false
  skip_final_snapshot       = var.environment == "production" ? false : true
  final_snapshot_identifier = "listedwheels-postgres-final-snapshot"

  tags = {
    Name = "listedwheels-postgres-primary"
  }
}
