export interface MessageData {
    id: number
    content: string
    userId: number
    channelId: number
    editable: boolean
    metadata: any
    createdAt: number
    updatedAt: any
    files: any[]
    reactions: any[]
}
