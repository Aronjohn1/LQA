-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT,
    "user_name" TEXT,
    "pass" TEXT,
    "role" TEXT,
    "profile_image" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "College" (
    "id" SERIAL NOT NULL,
    "c_id" TEXT,
    "c_name" TEXT,
    "c_program" TEXT,
    "c_year_block" TEXT,
    "password" TEXT,
    "profile_image" TEXT,

    CONSTRAINT "College_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Senior" (
    "id" SERIAL NOT NULL,
    "s_id" TEXT,
    "s_name" TEXT,
    "s_program" TEXT,
    "s_gradelevel" TEXT,
    "s_section" TEXT,
    "password" TEXT,
    "profile_image" TEXT,

    CONSTRAINT "Senior_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Junior" (
    "id" SERIAL NOT NULL,
    "j_id" TEXT,
    "j_name" TEXT,
    "j_program" TEXT,
    "j_section" TEXT,
    "password" TEXT,
    "profile_image" TEXT,

    CONSTRAINT "Junior_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Elementary" (
    "id" SERIAL NOT NULL,
    "e_id" TEXT,
    "e_name" TEXT,
    "e_program" TEXT,
    "e_section" TEXT,
    "password" TEXT,
    "profile_image" TEXT,

    CONSTRAINT "Elementary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" SERIAL NOT NULL,
    "t_id" TEXT,
    "t_name" TEXT,
    "t_teacherlevel" TEXT,
    "password" TEXT,
    "profile_image" TEXT,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Instructor" (
    "id" SERIAL NOT NULL,
    "i_id" TEXT,
    "i_name" TEXT,
    "i_instructorlevel" TEXT,
    "password" TEXT,
    "profile_image" TEXT,

    CONSTRAINT "Instructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendancecollege" (
    "id" SERIAL NOT NULL,
    "ac_id" TEXT,
    "ac_name" TEXT,
    "ac_program" TEXT,
    "ac_year_block" TEXT,
    "ac_timein" TEXT,
    "ac_timeout" TEXT,
    "ac_date" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Attendancecollege_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendancesenior" (
    "id" SERIAL NOT NULL,
    "as_id" TEXT,
    "as_name" TEXT,
    "as_program" TEXT,
    "as_gradelevel" TEXT,
    "as_section" TEXT,
    "as_timein" TEXT,
    "as_timeout" TEXT,
    "as_date" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Attendancesenior_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendancejunior" (
    "id" SERIAL NOT NULL,
    "aj_id" TEXT,
    "aj_name" TEXT,
    "aj_program" TEXT,
    "aj_section" TEXT,
    "aj_timein" TEXT,
    "aj_timeout" TEXT,
    "aj_date" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Attendancejunior_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendanceelementary" (
    "id" SERIAL NOT NULL,
    "ae_id" TEXT,
    "ae_name" TEXT,
    "ae_program" TEXT,
    "ae_section" TEXT,
    "ae_timein" TEXT,
    "ae_timeout" TEXT,
    "ae_date" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Attendanceelementary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendanceteacher" (
    "id" SERIAL NOT NULL,
    "at_id" TEXT,
    "at_name" TEXT,
    "at_teacherlevel" TEXT,
    "at_timein" TEXT,
    "at_timeout" TEXT,
    "at_date" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Attendanceteacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendanceinstructor" (
    "id" SERIAL NOT NULL,
    "ai_id" TEXT,
    "ai_name" TEXT,
    "ai_instructorlevel" TEXT,
    "ai_timein" TEXT,
    "ai_timeout" TEXT,
    "ai_date" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Attendanceinstructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_college" (
    "id" SERIAL NOT NULL,
    "rc_id" INTEGER,
    "c_id" TEXT,
    "old_program" TEXT,
    "old_year_block" TEXT,
    "new_program" TEXT,
    "new_year_block" TEXT,
    "reason" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "admin_response" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "request_college_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_senior" (
    "id" SERIAL NOT NULL,
    "rs_id" INTEGER,
    "s_id" TEXT,
    "old_program" TEXT,
    "old_gradelevel" TEXT,
    "old_section" TEXT,
    "new_program" TEXT,
    "new_gradelevel" TEXT,
    "new_section" TEXT,
    "reason" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "admin_response" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "request_senior_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_junior" (
    "id" SERIAL NOT NULL,
    "rj_id" INTEGER,
    "j_id" TEXT,
    "old_program" TEXT,
    "old_section" TEXT,
    "new_program" TEXT,
    "new_section" TEXT,
    "reason" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "admin_response" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "request_junior_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_elementary" (
    "id" SERIAL NOT NULL,
    "re_id" INTEGER,
    "e_id" TEXT,
    "old_section" TEXT,
    "new_section" TEXT,
    "reason" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "admin_response" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "request_elementary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_teacher" (
    "id" SERIAL NOT NULL,
    "rt_id" INTEGER,
    "t_id" TEXT,
    "old_teacherlevel" TEXT,
    "new_teacherlevel" TEXT,
    "reason" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "admin_response" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "request_teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_instructor" (
    "id" SERIAL NOT NULL,
    "ri_id" INTEGER,
    "i_id" TEXT,
    "old_instructorlevel" TEXT,
    "new_instructorlevel" TEXT,
    "reason" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "admin_response" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "request_instructor_pkey" PRIMARY KEY ("id")
);
