import { parsePhoneNumberWithError } from 'libphonenumber-js'

interface DirectusMemberGroup {
  groups_id: {
    title: string
  }
}

export interface DirectusMember {
  id: string
  user_created: string
  date_created: string
  user_updated: string | null
  date_updated: string | null
  gender: string
  first_name: string
  last_name: string
  street: string
  post_code: string
  city: string
  email: string
  phone: string | null
  birthdate: string
  invoicing_method: string
  iban: string
  sign_up_token: string | null
  user: string | null
  groups: DirectusMemberGroup[]
}

interface DirectusEventParticipant {
  members_id: {
    first_name: string
    last_name: string
    birthdate: string
  }
}

export interface DirectusEvent {
  id: string
  user_created: string
  date_created: string
  user_updated: string | null
  date_updated: string | null
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  is_work_assignment: boolean
  participant: DirectusEventParticipant[]
}

export const getDirectusMembers = async (): Promise<(Omit<DirectusMember, 'groups'> & { groups: string[] })[]> => {
  const membersResponse = await fetch('https://admin.fischereiverein-burlafingen.de/items/members?fields=*,groups.groups_id.title&limit=-1&sort=last_name', {
    headers: {
      Authorization: `Bearer JQiojSjKWLTktT3gIPRFNidenG08q6MW`,
    },
  })
  if (!membersResponse.ok) {
    throw new Error(`Failed to fetch members: ${membersResponse.status} ${membersResponse.statusText}`)
  }
  const membersData = await membersResponse.json() as { data: DirectusMember[] }

  return membersData.data.map(member => ({
    ...member,
    phone: member.phone ? parsePhoneNumberWithError(member.phone, 'DE')?.formatInternational() : null,
    groups: member.groups.map(group => group.groups_id.title),
  }))
}

export const getDirectusEvents = async (): Promise<DirectusEvent[]> => {
  const eventsResponse = await fetch('https://admin.fischereiverein-burlafingen.de/items/events?fields=*,participant.members_id.*&limit=-1&sort=start_date', {
    headers: {
      Authorization: `Bearer JQiojSjKWLTktT3gIPRFNidenG08q6MW`,
    },
  })
  if (!eventsResponse.ok) {
    throw new Error(`Failed to fetch events: ${eventsResponse.status} ${eventsResponse.statusText}`)
  }
  const eventsData = await eventsResponse.json() as { data: DirectusEvent[] }
  return eventsData.data
}
