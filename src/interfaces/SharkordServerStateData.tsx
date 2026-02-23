export interface SharkordServerStateData {
    categories: Category[]
    channels: Channel[]
    users: User[]
    serverId: string
    serverName: string
    ownUserId: number
    voiceMap: VoiceMap
    roles: Role[]
    emojis: Emoji[]
    publicSettings: PublicSettings
    channelPermissions: Record<string, ChannelPermissions>
    readStates: ReadStates
    commands: Commands
    externalStreamsMap: ExternalStreamsMap
}

export interface Category {
    id: number
    name: string
    position: number
    createdAt: number
    updatedAt: any
}

export interface Channel {
    id: number
    type: string
    name: string
    topic?: string
    fileAccessToken: string
    fileAccessTokenUpdatedAt: number
    private: boolean
    position: number
    categoryId: number
    createdAt: number
    updatedAt: any
}

export interface User {
    id: number
    name: string
    bannerColor?: string
    bio?: string
    banned: boolean
    avatarId?: number
    bannerId?: number
    avatar?: Avatar
    banner?: Banner
    createdAt: number
    roleIds: number[]
    status: string
}

export interface Avatar {
    id: number
    name: string
    originalName: string
    md5: string
    userId: number
    size: number
    mimeType: string
    extension: string
    createdAt: number
    updatedAt: any
}

export interface Banner {
    id: number
    name: string
    originalName: string
    md5: string
    userId: number
    size: number
    mimeType: string
    extension: string
    createdAt: number
    updatedAt: any
}

export interface VoiceMap {
    "7": N7
    "8": N8
    "10": N10
}

export interface N7 {
    users: Users
}

export interface Users { }

export interface N8 {
    users: Users2
}

export interface Users2 { }

export interface N10 {
    users: Users3
}

export interface Users3 { }

export interface Role {
    id: number
    name: string
    color: string
    isPersistent: boolean
    isDefault: boolean
    createdAt: number
    updatedAt: any
    permissions: string[]
}

export interface Emoji {
    id: number
    name: string
    fileId: number
    userId: number
    createdAt: number
    updatedAt: any
    file: File
    user: User2
}

export interface File {
    id: number
    name: string
    originalName: string
    md5: string
    userId: number
    size: number
    mimeType: string
    extension: string
    createdAt: number
    updatedAt: any
}

export interface User2 {
    id: number
    name: string
    bannerColor: string
    bio: string
    createdAt: number
    banned: boolean
    avatarId: number
    bannerId: number
}

export interface PublicSettings {
    description: string
    name: string
    serverId: string
    storageUploadEnabled: boolean
    storageQuota: number
    storageUploadMaxFileSize: number
    storageSpaceQuotaByUser: number
    storageOverflowAction: string
    enablePlugins: boolean
}

export interface ChannelPermissions {
    channelId: number
    permissions: Permissions
}

export interface Permissions {
    VIEW_CHANNEL: boolean
    SEND_MESSAGES: boolean
    JOIN: boolean
    SPEAK: boolean
    SHARE_SCREEN: boolean
    WEBCAM: boolean
}

export interface N2 {
    channelId: number
    permissions: Permissions2
}

export interface Permissions2 {
    VIEW_CHANNEL: boolean
    SEND_MESSAGES: boolean
    JOIN: boolean
    SPEAK: boolean
    SHARE_SCREEN: boolean
    WEBCAM: boolean
}

export interface N5 {
    channelId: number
    permissions: Permissions3
}

export interface Permissions3 {
    VIEW_CHANNEL: boolean
    SEND_MESSAGES: boolean
    JOIN: boolean
    SPEAK: boolean
    SHARE_SCREEN: boolean
    WEBCAM: boolean
}

export interface N6 {
    channelId: number
    permissions: Permissions4
}

export interface Permissions4 {
    VIEW_CHANNEL: boolean
    SEND_MESSAGES: boolean
    JOIN: boolean
    SPEAK: boolean
    SHARE_SCREEN: boolean
    WEBCAM: boolean
}

export interface N72 {
    channelId: number
    permissions: Permissions5
}

export interface Permissions5 {
    VIEW_CHANNEL: boolean
    SEND_MESSAGES: boolean
    JOIN: boolean
    SPEAK: boolean
    SHARE_SCREEN: boolean
    WEBCAM: boolean
}

export interface N82 {
    channelId: number
    permissions: Permissions6
}

export interface Permissions6 {
    VIEW_CHANNEL: boolean
    SEND_MESSAGES: boolean
    JOIN: boolean
    SPEAK: boolean
    SHARE_SCREEN: boolean
    WEBCAM: boolean
}

export interface N9 {
    channelId: number
    permissions: Permissions7
}

export interface Permissions7 {
    VIEW_CHANNEL: boolean
    SEND_MESSAGES: boolean
    JOIN: boolean
    SPEAK: boolean
    SHARE_SCREEN: boolean
    WEBCAM: boolean
}

export interface N102 {
    channelId: number
    permissions: Permissions8
}

export interface Permissions8 {
    VIEW_CHANNEL: boolean
    SEND_MESSAGES: boolean
    JOIN: boolean
    SPEAK: boolean
    SHARE_SCREEN: boolean
    WEBCAM: boolean
}

export interface N29 {
    channelId: number
    permissions: Permissions9
}

export interface Permissions9 {
    VIEW_CHANNEL: boolean
    SEND_MESSAGES: boolean
    JOIN: boolean
    SPEAK: boolean
    SHARE_SCREEN: boolean
    WEBCAM: boolean
}

export interface ReadStates {
    "1": number
    "5": number
    "7": number
    "29": number
}

export interface Commands { }

export interface ExternalStreamsMap {
    "7": N73
    "8": N83
    "10": N103
}

export interface N73 { }

export interface N83 { }

export interface N103 { }