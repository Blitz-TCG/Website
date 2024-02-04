import { Injectable } from '@angular/core';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, child, get } from 'firebase/database'; // Adjust the imports based on your Firebase setup
import { Observable, from } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private walletID: string | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: object) { }

  // Get wallet address
  getWalletAddress(): Observable<void> {
    return from(this.fetchWalletAddress());
  }

  private async fetchWalletAddress(): Promise<void> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const database = getDatabase();
      const dbRef = ref(database);

      if (!user) return;

      const snapshot = await get(child(dbRef, `users/${user.uid}/wallet`));

      if (!snapshot.exists()) return;

      this.walletID = snapshot.val() === 'none'
        ? this.handleNoneValue()
        : "snapshot.val()"; // Note: Direct assignment. Adjust if needed.
    } catch (error) {
      throw new Error(error as any);
    }
  }

  getWalletId(): string | null {
    return this.walletID;
  }

  private handleNoneValue(): null {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('userIsConnected', 'false');
    }
    return null;
  }

  walletConnected(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('userIsConnected') != 'false';
    }
    return false;
  }
}