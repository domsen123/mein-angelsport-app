import type { DirectusEvent, DirectusMember } from './directus'
import { ulid } from 'ulid'
import { getDatabase } from '../../server/database/client'
import { club, clubMember, clubMemberRole, clubRole, water } from '../../server/database/schema'
import { auth } from '../../server/utils/auth'

export const createUser = async (): Promise<string> => {
  await auth.api.signUpEmail({
    body: {
      name: 'Dominic Marx (Admin)',
      email: 'hey@marx-media.net',
      password: 'passw0rd',
    },
  })

  const { user: { id: userId } } = await auth.api.signUpEmail({
    body: {
      name: 'Dominic Marx',
      email: 'dmarx@marxulm.de',
      password: 'passw0rd',
    },
  })
  return userId
}

export const createClub = async (userId: string) => {
  const db = getDatabase()
  const clubId = ulid()
  const now = new Date()
  await db.insert(club).values({
    id: clubId,
    name: 'Fischereiverein Burlafingen e.V.',
    shortName: 'FV Burlafingen',
    slug: 'fv-burlafingen',
    createdBy: userId,
    updatedBy: userId,
    createdAt: now,
    updatedAt: now,
  })
  return clubId
}

export const createClubRoles = async (clubId: string, userId: string) => {
  const now = new Date()
  const db = getDatabase()
  return await db.insert(clubRole).values([
    { id: ulid(), clubId, name: 'Vorstandschaft', isAdmin: true, createdBy: userId, updatedBy: userId, createdAt: now, updatedAt: now, exemptFromWorkDuties: true },
    { id: ulid(), clubId, name: 'Behindert', createdBy: userId, updatedBy: userId, createdAt: now, updatedAt: now, exemptFromWorkDuties: true },
    { id: ulid(), clubId, name: 'Rentner', createdBy: userId, updatedBy: userId, createdAt: now, updatedAt: now, exemptFromWorkDuties: true },
    { id: ulid(), clubId, name: 'Rasenmäher', createdBy: userId, updatedBy: userId, createdAt: now, updatedAt: now, exemptFromWorkDuties: true },
    { id: ulid(), clubId, name: 'Fischereiaufseher', createdBy: userId, updatedBy: userId, createdAt: now, updatedAt: now, exemptFromWorkDuties: true },
    { id: ulid(), clubId, name: 'Arbeitseinsatzbefreit', createdBy: userId, updatedBy: userId, createdAt: now, updatedAt: now, exemptFromWorkDuties: true },
  ]).returning()
}

export const findWaterByName = async (name: string) => {
  return await getDatabase().query.water.findFirst({
    where: (water, { eq }) => eq(water.name, name),
  })
}
export const findWatersByNames = async (names: string[]) => {
  return await getDatabase().query.water.findMany({
    where: (water, { inArray }) => inArray(water.name, names),
  })
}

export const createClubWaters = async (clubId: string, userId: string) => {
  const now = new Date()
  const db = getDatabase()
  const waters = await db.insert(water).values([
    { id: ulid(), name: 'Haugsee', slug: '89233-haugsee', postCode: '89233', type: 'lentic', createdBy: userId, updatedBy: userId, createdAt: now, updatedAt: now },
    { id: ulid(), name: 'Waldsee', slug: '89233-waldsee', postCode: '89233', type: 'lentic', createdBy: userId, updatedBy: userId, createdAt: now, updatedAt: now },
    { id: ulid(), name: 'Fischersee', slug: '89233-fischersee', postCode: '89233', type: 'lentic', createdBy: userId, updatedBy: userId, createdAt: now, updatedAt: now },
    { id: ulid(), name: 'Reidatsee', slug: '89233-reidatsee', postCode: '89233', type: 'lentic', createdBy: userId, updatedBy: userId, createdAt: now, updatedAt: now },
    { id: ulid(), name: 'Donau', slug: 'donau', postCode: '89233', type: 'lotic', createdBy: userId, updatedBy: userId, createdAt: now, updatedAt: now },
    { id: ulid(), name: 'Leibi', slug: 'leibi', postCode: '89233', type: 'lotic', createdBy: userId, updatedBy: userId, createdAt: now, updatedAt: now },
  ]).returning()

  for (const water of waters) {
    await db.insert(clubWater).values({
      waterId: water.id,

      clubId,
      assignedAt: now,
      assignedBy: userId,

      validated: true,
      validatedAt: now,
      validatedBy: userId,

      createdAt: now,
      createdBy: userId,
      updatedAt: now,
      updatedBy: userId,
    })
  }
}

export const createPermits = async (clubId: string, userId: string) => {
  const data = [
    {
      water: ['Haugsee', 'Waldsee', 'Fischersee', 'Reidatsee'],
      permit: {
        name: 'Seen des Fischereiverein Burlafingen e.V.',
        type: 'annual' as const,
        period: {
          validFrom: new Date(2026, 0, 1),
          validTo: new Date(2026, 11, 31),
          sellingFrom: new Date(2026, 0, 6),
        },
        options: [{
          name: 'Standard',
          price: String(255),
          startPermitNumber: 1,
          endPermitNumber: 150,
          nextPermitNumber: 1,
        }],
      },
    },
    {
      water: ['Donau'],
      permit: {
        name: 'Donau Permits',
        type: 'annual' as const,
        period: {
          validFrom: new Date(2026, 0, 1),
          validTo: new Date(2026, 11, 31),
          sellingFrom: new Date(2026, 0, 6),
        },
        options: [
          {
            name: 'Staukarte',
            price: String(105),
            startPermitNumber: 1,
            endPermitNumber: 150,
            nextPermitNumber: 1,
          },
          {
            name: 'Vollkarte',
            price: String(105),
            startPermitNumber: 151,
            endPermitNumber: 300,
            nextPermitNumber: 151,
          },
        ],
      },
    },
    {
      water: ['Leibi'],
      permit: {
        name: 'Abschnitt des Fischereiverein Burlafingen e.V.',
        type: 'annual' as const,
        period: {
          validFrom: new Date(2026, 0, 1),
          validTo: new Date(2026, 11, 31),
          sellingFrom: new Date(2026, 0, 6),
        },
        options: [{
          name: 'Standard',
          price: String(85),
          startPermitNumber: 1,
          endPermitNumber: 150,
          nextPermitNumber: 1,
        }],
      },
    },
  ]

  const db = getDatabase()
  for (const item of data) {
    const waters = await findWatersByNames(item.water)
    const permitData = item.permit

    // Step 1: Create permit
    const [createdPermit] = await db
      .insert(permit)
      .values({
        id: ulid(),
        clubId,
        name: permitData.name,
        type: permitData.type,
        createdAt: new Date(),
        createdBy: userId,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .returning()

    // Step 2: Create permit period
    const [createdPeriod] = await db
      .insert(permitPeriod)
      .values({
        id: ulid(),
        permitId: createdPermit.id,
        validFrom: permitData.period.validFrom,
        validTo: permitData.period.validTo,
        sellingFrom: permitData.period.sellingFrom,
        createdAt: new Date(),
        createdBy: userId,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .returning()

    // Step 3: Create permit option(s)
    for (const option of permitData.options) {
      await db
        .insert(permitOption)
        .values({
          id: ulid(),
          periodId: createdPeriod.id,
          name: option.name,
          description: null,
          price: option.price,
          startPermitNumber: option.startPermitNumber,
          endPermitNumber: option.endPermitNumber,
          nextPermitNumber: option.nextPermitNumber,
          createdAt: new Date(),
          createdBy: userId,
          updatedAt: new Date(),
          updatedBy: userId,
        })
    }

    // Step 4: Link waters to permit
    for (const water of waters) {
      await db.insert(permitWater).values({
        permitId: createdPermit.id,
        waterId: water.id,
        assignedAt: new Date(),
      })
    }
  }
}

export const getClubRoleByName = async (clubId: string, name: string) => {
  const db = getDatabase()
  return await db.query.clubRole.findFirst({
    columns: {
      id: true,
      name: true,
    },
    where: (role, { eq, and }) => and(
      eq(role.clubId, clubId),
      eq(role.name, name),
    ),
  })
}

export const createMember = async (member: (Omit<DirectusMember, 'groups'> & { groups: string[] }), clubId: string, userId: string) => {
  const db = getDatabase()
  const memberId = ulid()
  const now = new Date()

  await db.insert(clubMember).values({
    id: memberId,
    userId: member.first_name === 'Dominic' && member.last_name === 'Marx' ? userId : null,
    clubId,
    firstName: member.first_name,
    lastName: member.last_name,
    birthDate: member.birthdate ? new Date(member.birthdate) : null,
    address: member.street,
    postCode: member.post_code,
    city: member.city,
    email: member.email || null,
    phone: member.phone || null,
    preferredInvoicingMethod: member.invoicing_method === 'by_post' ? 'postal_mail' : 'email',
    createdBy: userId,
    updatedBy: userId,
    createdAt: now,
    updatedAt: now,
  })

  return memberId
}

export const findMember = async (clubId: string, firstName: string, lastName: string, birthDate: Date | string) => {
  birthDate = typeof birthDate === 'string' ? new Date(birthDate) : birthDate

  return await getDatabase().query.clubMember.findFirst({
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      birthDate: true,
    },
    where: (member, { eq, and }) => and(
      eq(member.clubId, clubId),
      eq(member.firstName, firstName),
      eq(member.lastName, lastName),
      eq(member.birthDate, birthDate),
    ),
  })
}

export const findRoleByName = async (clubId: string, name: string) => {
  return await getDatabase().query.clubRole.findFirst({
    columns: {
      id: true,
      name: true,
    },
    where: (role, { eq, and }) => and(
      eq(role.clubId, clubId),
      eq(role.name, name),
    ),
  })
}

export const assignRoleToMember = async (clubId: string, memberId: string, roleName: string): Promise<void> => {
  const role = await findRoleByName(clubId, roleName)
  if (role) {
    const db = getDatabase()
    await db.insert(clubMemberRole).values({
      memberId,
      roleId: role.id,
      assignedAt: new Date(),
    }).onConflictDoNothing({
      target: [clubMemberRole.memberId, clubMemberRole.roleId],
    })
  }
}

export const createEvent = async (clubId: string, userId: string, directusEvent: DirectusEvent) => {
  const db = getDatabase()

  const [createdEvent] = await db.insert(event).values({
    id: ulid(),
    clubId,
    title: directusEvent.title,
    description: directusEvent.description || null,
    startDate: new Date(directusEvent.start_date),
    endDate: directusEvent.end_date ? new Date(directusEvent.end_date) : null,
    isWorkDuty: directusEvent.is_work_assignment,
    isPublic: false,
    type: 'other',
    createdBy: userId,
    updatedBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning()
  return createdEvent
}

export const assignParticipantToEvent = async (eventId: string, memberId: string, userId: string) => {
  const db = getDatabase()

  const [createdParticipant] = await db.insert(eventParticipant).values({
    id: ulid(),
    eventId,
    memberId,
    registeredAt: new Date(),
    status: 'attended',
    createdBy: userId,
    updatedBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning()
  return createdParticipant
}
