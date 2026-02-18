import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Reviews from './pages/Reviews';
import Contact from './pages/Contact';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <Layout>
            <section id="home">
              <Home />
            </section>
            <section id="about">
              <About />
            </section>
            <section id="services">
              <Services />
            </section>
            {/* <section id="pricing">
              <Pricing />
            </section> */}
            <section id="reviews">
              <Reviews />
            </section>
            <section id="contact">
              <Contact />
            </section>
          </Layout>
        } />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
