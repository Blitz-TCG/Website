import { Injectable } from '@angular/core';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, child, get } from 'firebase/database'; // Adjust the imports based on your Firebase setup
import { Observable, from } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private walletID: string | null = null;
  private walletConnectedSource = new BehaviorSubject<boolean>(false);
  private walletUpdatedSource = new BehaviorSubject<string | null>(null);
  private resetTokenStateSource = new BehaviorSubject<boolean>(false);

 walletConnected$ = this.walletConnectedSource.asObservable();
 walletUpdated$ = this.walletUpdatedSource.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: object) { }

  resetTokenState() {
    this.resetTokenStateSource.next(true);
  }

  setWalletConnected(status: boolean): void {
    this.walletConnectedSource.next(status);
    // Update localStorage whenever the state changes
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('userIsConnected', String(status));
    }
  }

  updateWalletID(walletID: string | null) {
    this.walletID = walletID;
    this.walletUpdatedSource.next(walletID);
  }

  // Method to fetch wallet address (adjusted as needed for your application)
  getWalletAddress(): Observable<void> {
    return from(this.fetchWalletAddress());
  }

  private async fetchWalletAddress(): Promise<void> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const database = getDatabase();

      if (!user) return;

      const snapshot = await get(child(ref(database), `users/${user.uid}/wallet`));
      if (snapshot.exists()) {
        const walletValue = snapshot.val();
        this.walletID = walletValue === 'none' ? null : walletValue;
        // Optionally, update the connected state based on the retrieved value
        this.setWalletConnected(walletValue !== 'none');
      }
    } catch (error) {
      console.error("Error fetching wallet address:", error);
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
