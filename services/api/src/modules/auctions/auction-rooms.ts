import type { WebSocket } from 'ws'

class AuctionRoomManager {
  private rooms: Map<string, Set<WebSocket>> = new Map()

  join(auctionId: string, socket: WebSocket): void {
    const room = this.rooms.get(auctionId)
    if (room) {
      room.add(socket)
      return
    }

    this.rooms.set(auctionId, new Set([socket]))
  }

  leave(auctionId: string, socket: WebSocket): void {
    const room = this.rooms.get(auctionId)
    if (!room) {
      return
    }

    room.delete(socket)
    if (room.size === 0) {
      this.rooms.delete(auctionId)
    }
  }

  broadcast(auctionId: string, message: unknown): void {
    const room = this.rooms.get(auctionId)
    if (!room) {
      return
    }

    const payload = JSON.stringify(message)
    room.forEach((socket) => {
      if (socket.readyState === 1) {
        socket.send(payload)
      }
    })
  }
}

export const auctionRooms = new AuctionRoomManager()
