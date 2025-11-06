-- CreateTable
CREATE TABLE "cabinets" (
    "room_id" SERIAL NOT NULL,
    "room_number" VARCHAR(10) NOT NULL,
    "room_name" VARCHAR(100),

    CONSTRAINT "cabinets_pkey" PRIMARY KEY ("room_id")
);

-- CreateTable
CREATE TABLE "classes" (
    "class_id" SERIAL NOT NULL,
    "class_name" VARCHAR(50) NOT NULL,
    "students_count" INTEGER,
    "class_type" VARCHAR(50),
    "room_number" VARCHAR(10),

    CONSTRAINT "classes_pkey" PRIMARY KEY ("class_id")
);

-- CreateTable
CREATE TABLE "study_plan" (
    "study_plan_id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "hours_per_week" DECIMAL(4,1) NOT NULL,
    "hours_per_year" INTEGER NOT NULL,

    CONSTRAINT "study_plan_pkey" PRIMARY KEY ("study_plan_id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "subject_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" VARCHAR(20) DEFAULT 'required',

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("subject_id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "teacher_id" SERIAL NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "subject" VARCHAR(50) NOT NULL,
    "classroom" VARCHAR(20),
    "nuances" VARCHAR(50),

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("teacher_id")
);

-- CreateTable
CREATE TABLE "schedule" (
    "schedule_id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "room_id" INTEGER NOT NULL,
    "day_of_week" VARCHAR(20) NOT NULL,
    "lesson_num" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,

    CONSTRAINT "schedule_pkey" PRIMARY KEY ("schedule_id")
);

-- AddForeignKey
ALTER TABLE "study_plan" ADD CONSTRAINT "fk_class" FOREIGN KEY ("class_id") REFERENCES "classes"("class_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "study_plan" ADD CONSTRAINT "fk_subject" FOREIGN KEY ("subject_id") REFERENCES "subjects"("subject_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "fk_schedule_cabinet" FOREIGN KEY ("room_id") REFERENCES "cabinets"("room_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "fk_schedule_class" FOREIGN KEY ("class_id") REFERENCES "classes"("class_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "fk_schedule_subject" FOREIGN KEY ("subject_id") REFERENCES "subjects"("subject_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "fk_schedule_teacher" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("teacher_id") ON DELETE CASCADE ON UPDATE NO ACTION;
