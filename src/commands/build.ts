import {Target} from '../builders'

const isTarget = (target: string): target is Target => ['client', 'server'].includes(target)
