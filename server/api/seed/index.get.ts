import type { InferSelectModel } from 'drizzle-orm'
import type { CreateClubRoleCommand } from '~~/server/actions/clubRole/create-club-role'
import type { CreateWaterCommand } from '~~/server/actions/water/create-water'
import type { clubEvent, clubMember, water } from '~~/server/database/schema'
import { createClub } from '~~/server/actions/club/create-club'
import { assignAttendeeToEvent } from '~~/server/actions/clubEvent/assign-attendee-to-event'
import { createClubEvent } from '~~/server/actions/clubEvent/create-club-event'

import { createClubMember } from '~~/server/actions/clubMember/create-club-member'
import { _getClubMemberByNameAndBirthdate } from '~~/server/actions/clubMember/temp/_get-by-name-and-birthdate'
import { createClubRole } from '~~/server/actions/clubRole/create-club-role'
import { assignWaterToClub } from '~~/server/actions/clubWater/assign-water-to-club'
import { createPermit } from '~~/server/actions/permit/create-permit'
import { createPermitOption } from '~~/server/actions/permit/create-permit-option'
import { createPermitOptionPeriod } from '~~/server/actions/permit/create-permit-option-period'
import { assignPermitToWater } from '~~/server/actions/permitWater/assign-permit-to-water'
import { createWater } from '~~/server/actions/water/create-water'
import { getDatabase } from '~~/server/database/client'
import { createUser } from '~~/server/services/application'
import { getDirectusEvents, getDirectusMembers } from '~~/server/services/directus'

export default defineEventHandler(async () => {
  try {
    const userId = await createUser()

    const context = {
      userId,
      timestamp: new Date(),
    }

    await getDatabase().transaction(async (tx) => {
      // create a club
      const club = await createClub(
        {
          name: 'Fischereiverein Burlafingen e.V.',
          shortName: 'FV Burlafingen',
          slug: 'fv-burlafingen',
        },
        context,
        tx,
      )

      // create waters
      const createdWaters: InferSelectModel<typeof water>[] = []
      const waters: CreateWaterCommand[] = [
        { type: 'lentic', name: 'Haugsee', postCode: '89233' },
        { type: 'lentic', name: 'Waldsee', postCode: '89233' },
        { type: 'lentic', name: 'Fischersee', postCode: '89233' },
        { type: 'lentic', name: 'Reidatsee', postCode: '89233' },
        { type: 'lotic', name: 'Donau', postCode: '89233' },
        { type: 'lotic', name: 'Leibi', postCode: '89233' },
      ]

      for (const waterData of waters) {
        const createdWater = await createWater(waterData, context, tx)
        if (!createdWater) {
          throw new Error(`Failed to create water: ${waterData.name}`)
        }
        createdWaters.push(createdWater)
        await assignWaterToClub({
          clubId: club.id,
          waterId: createdWater.id,
        }, context, tx)
      }

      // create club roles
      const roles: CreateClubRoleCommand[] = [
        { clubId: club.id, name: 'Fischereiaufseher', description: 'Verantwortlich für die Überwachung der Einhaltung der Fischereivorschriften.', isClubAdmin: false, isExemptFromWorkDuties: true },
        { clubId: club.id, name: 'Rentner', description: 'Mitglied im Ruhestand, von Arbeitsdiensten befreit.', isClubAdmin: false, isExemptFromWorkDuties: true },
        { clubId: club.id, name: 'Rasenmähergruppe', description: 'Gruppe verantwortlich für das Mähen des Rasens.', isClubAdmin: false, isExemptFromWorkDuties: true },
        { clubId: club.id, name: 'Arbeitseinsatzbefreit', description: 'Mitglieder, die von Arbeitseinsätzen befreit sind.', isClubAdmin: false, isExemptFromWorkDuties: true },
      ]

      for (const roleData of roles) {
        await createClubRole(roleData, context, tx)
      }

      // create club members
      const createdClubMembers: InferSelectModel<typeof clubMember>[] = []
      const directusClubMembers = await getDirectusMembers()
      for (const member of directusClubMembers) {
        if (member.first_name === 'Dominic' && member.last_name === 'Marx') {
          // skip myself
          continue
        }
        try {
          const clubMember = await createClubMember({
            clubId: club.id,
            // userId: member.first_name === 'Dominic' && member.last_name === 'Marx' ? userId : undefined,

            firstName: member.first_name,
            lastName: member.last_name,
            birthdate: member.birthdate ? new Date(member.birthdate) : undefined,

            street: member.street || undefined,
            postalCode: member.post_code || undefined,
            city: member.city || undefined,

            preferredInvoicingMethod: member.invoicing_method === 'by_post' ? 'postal_mail' : 'email',

            email: member.email || undefined,
            phone: member.phone || undefined,

            country: 'Germany',

          }, context, tx)
          if (!clubMember) {
            throw new Error(`Failed to create club member: ${member.first_name} ${member.last_name}`)
          }
          createdClubMembers.push(clubMember)
        }
        catch (error: any) {
          console.log('Error creating club member:', member, error)
          throw error
        }
      }

      // create club events
      const createdClubEvents: InferSelectModel<typeof clubEvent>[] = []
      const directusEvents = await getDirectusEvents()
      for (const event of directusEvents) {
        try {
          const createdEvent = await createClubEvent({
            clubId: club.id,
            name: event.title,
            description: event.description || undefined,
            content: undefined,

            dateStart: new Date(event.start_date).toISOString(),
            dateEnd: event.end_date ? new Date(event.end_date).toISOString() : undefined,

            isWorkDuty: event.is_work_assignment || false,

            isPublic: false,
          }, context, tx)
          if (!createdEvent) {
            throw new Error(`Failed to create club event: ${event.title}`)
          }
          createdClubEvents.push(createdEvent)

          // assign participants
          for (const participant of event.participant || []) {
            const clubMember = await _getClubMemberByNameAndBirthdate({
              firstName: participant.members_id.first_name,
              lastName: participant.members_id.last_name,
              birthdate: participant.members_id.birthdate ? new Date(participant.members_id.birthdate) : new Date('1900-01-01'),
            }, context, tx)
            if (!clubMember) {
              console.log(`\x1B[31m  - Could not find member for event participation: ${participant.members_id.first_name} ${participant.members_id.last_name}\x1B[0m`)
            }
            else {
              console.log(`  - Assigning event participation to member: ${participant.members_id.first_name} ${participant.members_id.last_name}`)
              await assignAttendeeToEvent({
                eventId: createdEvent.id,
                memberId: clubMember.id,
              }, context, tx)
            }
          }
        }
        catch (error: any) {
          console.log('Error creating club event:', event, error)
          throw error
        }
      }

      // create permits
      const permits = [
        {
          name: 'Seen des FV Burlafingen e. V.',
          waters: ['Haugsee', 'Waldsee', 'Fischersee', 'Reidatsee'],
          options: [
            { name: undefined, description: undefined, periods: [
              { validFrom: '2026-01-01', validTo: '2026-12-31', priceCents: '25500', permitNumberStart: 1, permitNumberEnd: 150 },
            ] },
          ],
        },
        {
          name: 'Donau',
          waters: ['Donau'],
          options: [
            { name: 'Staukarte', description: undefined, periods: [
              { validFrom: '2026-01-01', validTo: '2026-12-31', priceCents: '10500', permitNumberStart: 1, permitNumberEnd: 150 },
            ] },
            { name: 'Vollkarte', description: undefined, periods: [
              { validFrom: '2026-01-01', validTo: '2026-12-31', priceCents: '13500', permitNumberStart: 1, permitNumberEnd: 150 },
            ] },
          ],
        },
        {
          name: 'Leibi',
          waters: ['Leibi'],
          options: [
            { name: 'Leibiabschnitt des FV Burlafingen', description: undefined, periods: [
              { validFrom: '2026-01-01', validTo: '2026-12-31', priceCents: '8500', permitNumberStart: 1, permitNumberEnd: 150 },
            ] },
          ],
        },
      ]

      for (const permitData of permits) {
        const createdPermit = await createPermit({
          clubId: club.id,
          name: permitData.name,
        }, context, tx)

        if (!createdPermit) {
          throw new Error(`Failed to create permit: ${permitData.name}`)
        }

        // assign permit to waters
        for (const waterName of permitData.waters) {
          const water = createdWaters.find(w => w.name === waterName)
          if (!water) {
            throw new Error(`Water not found: ${waterName}`)
          }
          await assignPermitToWater({
            permitId: createdPermit.id,
            waterId: water.id,
          }, context, tx)
        }

        // create permit options and periods
        for (const optionData of permitData.options) {
          // create permit option
          const createdOption = await createPermitOption({
            clubId: club.id,
            permitId: createdPermit.id,
            name: optionData.name,
            description: optionData.description,
          }, context, tx)

          if (!createdOption) {
            throw new Error(`Failed to create permit option: ${optionData.name}`)
          }

          for (const periodData of optionData.periods) {
            await createPermitOptionPeriod({
              clubId: club.id,
              permitId: createdPermit.id,
              optionId: createdOption.id,
              validFrom: periodData.validFrom,
              validTo: periodData.validTo,
              priceCents: periodData.priceCents,
              permitNumberStart: periodData.permitNumberStart,
              permitNumberEnd: periodData.permitNumberEnd,
            }, context, tx)
          }
        }
      }
    })

    return {
      success: true,
    }
  }
  catch (error: any) {
    console.log(error)
  }
})
