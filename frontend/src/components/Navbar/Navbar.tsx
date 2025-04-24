'use client';

import Link from 'next/link';
import { Searchbar } from '../Searchbar/Searchbar';
import styles from './Navbar.module.css';

export function Navbar() {
  return (
    <nav className={`${styles.navbar} navbar border-b shadow-sm`}>
      <div className="container flex items-center justify-between py-4 px-6">
        {/* Logo / Brand */}
        <Searchbar
          placeholder="Search for a patient"
          onSearch={a => {
            console.log(a);
          }}
        />

        {/* Nav links */}
        <ul className="flex space-x-4">
          <li>
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 transition"
            >
              Notifications
            </Link>
          </li>
          <li>
            <Link
              href="/patients"
              className="text-gray-600 hover:text-gray-900 transition"
            >
              Account
            </Link>
          </li>
          {/* add more links as needed */}
        </ul>
      </div>
    </nav>
  );
}
