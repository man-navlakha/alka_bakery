import React from 'react'
import Navbar from '../components/self/Navbar'
import ContactForm from '../components/self/ContactForm'
import AdminProducts from './AdminProducts'
import ShopPage from './ShopPage'

const Main = () => {
  return (
    <div>
      <Navbar />
      <ContactForm />

      <ShopPage />
      <AdminProducts />
    </div>
  )
}

export default Main
