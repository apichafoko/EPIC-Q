const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFormSave() {
  try {
    console.log('=== TESTING FORM SAVE ===');
    
    // Buscar un hospital existente
    const hospital = await prisma.hospital.findFirst({
      where: {
        name: 'Clínica del Valle'
      }
    });

    if (!hospital) {
      console.log('No hospital found');
      return;
    }

    console.log('Testing with hospital:', hospital.name, hospital.id);

    // Simular datos del formulario
    const formData = {
      numBeds: "200",
      numOperatingRooms: "8",
      numIcuBeds: "20",
      avgWeeklySurgeries: "50",
      hasResidencyProgram: true,
      hasPreopClinic: "Sí",
      hasRapidResponseTeam: true,
      financingType: "Público",
      hasEthicsCommittee: true,
      universityAffiliated: true,
      notes: "Hospital de prueba",
      coordinatorName: "Dr. Test",
      coordinatorEmail: "test@hospital.com",
      coordinatorPhone: "+54 9 11 1234-5678",
      coordinatorPosition: "Jefe de Cirugía"
    };

    console.log('Form data:', formData);

    // Intentar guardar los datos estructurales
    const detailsResult = await prisma.hospitalDetails.upsert({
      where: { hospital_id: hospital.id },
      update: {
        num_beds: parseInt(formData.numBeds) || 0,
        num_operating_rooms: parseInt(formData.numOperatingRooms) || 0,
        num_icu_beds: parseInt(formData.numIcuBeds) || 0,
        avg_weekly_surgeries: parseInt(formData.avgWeeklySurgeries) || 0,
        has_residency_program: formData.hasResidencyProgram || false,
        has_preop_clinic: formData.hasPreopClinic || '',
        has_rapid_response_team: formData.hasRapidResponseTeam || false,
        financing_type: formData.financingType || '',
        has_ethics_committee: formData.hasEthicsCommittee || false,
        university_affiliated: formData.universityAffiliated || false,
        notes: formData.notes || ''
      },
      create: {
        hospital_id: hospital.id,
        num_beds: parseInt(formData.numBeds) || 0,
        num_operating_rooms: parseInt(formData.numOperatingRooms) || 0,
        num_icu_beds: parseInt(formData.numIcuBeds) || 0,
        avg_weekly_surgeries: parseInt(formData.avgWeeklySurgeries) || 0,
        has_residency_program: formData.hasResidencyProgram || false,
        has_preop_clinic: formData.hasPreopClinic || '',
        has_rapid_response_team: formData.hasRapidResponseTeam || false,
        financing_type: formData.financingType || '',
        has_ethics_committee: formData.hasEthicsCommittee || false,
        university_affiliated: formData.universityAffiliated || false,
        notes: formData.notes || ''
      }
    });

    console.log('Details saved:', detailsResult);

    // Verificar que se guardó correctamente
    const savedDetails = await prisma.hospitalDetails.findUnique({
      where: { hospital_id: hospital.id }
    });

    console.log('Saved details:', savedDetails);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFormSave();
