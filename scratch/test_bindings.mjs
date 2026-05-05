
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  console.log('--- Test: Creating a new teacher ---');
  const newTeacher = await prisma.teachers.create({
    data: {
      full_name: "Тестовый Учитель",
      subject: "Тестовый Предмет",
      classroom: "Тест-101"
    }
  });
  console.log(`Teacher created with ID: ${newTeacher.teacher_id}`);

  console.log('--- Test: Binding a class (class_id=1, subject_id=1) ---');
  const newBinding = await prisma.class_subjects.create({
    data: {
      teacher_id: newTeacher.teacher_id,
      class_id: 1, // 7Б
      subject_id: 1, // Қазақ тілі
      group_type: "Толық сынып"
    }
  });
  console.log(`Binding created with ID: ${newBinding.id}`);

  console.log('--- Test: Verifying binding exists ---');
  const checkBinding = await prisma.class_subjects.findUnique({
    where: { id: newBinding.id }
  });
  if (checkBinding) console.log('✅ Binding exists in DB');
  else throw new Error('❌ Binding not found!');

  console.log('--- Test: Unbinding (deleting binding) ---');
  await prisma.class_subjects.delete({
    where: { id: newBinding.id }
  });
  const checkDeleted = await prisma.class_subjects.findUnique({
    where: { id: newBinding.id }
  });
  if (!checkDeleted) console.log('✅ Binding successfully removed');
  else throw new Error('❌ Binding still exists!');

  console.log('--- Test: Cleanup (deleting teacher) ---');
  await prisma.teachers.delete({
    where: { teacher_id: newTeacher.teacher_id }
  });
  console.log('✅ Teacher cleaned up');
  
  console.log('\n--- ALL TESTS PASSED SUCCESSFULLY ---');
}

test()
  .catch(e => {
    console.error('TEST FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
