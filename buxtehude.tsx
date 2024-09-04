import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const BuxtehudeOutline = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-4">Buxtehude - Prelude in C major, BuxWV 137</h1>
      <h2 className="text-xl font-semibold mb-2">Jake Oh</h2>

      <Accordion type="single" collapsible>
        <AccordionItem value="composer">
          <AccordionTrigger>Dieterich Buxtehude</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-6">
              <li>Danish-German organist and composer born in 1637 (probably in Helsingborg)</li>
              <li>Worked in St. Mary's in Helsingborg (Sweden, ?-1660), Helsingør (Denmark, 1660-1668), Lübeck (Germany, 1668-1707)</li>
              <li>Stylus Phantasticus (Frescobaldi – Froberger – Buxtehude – J. S. Bach)</li>
              <li>J. S. Bach visited in 1705. Dieterich Buxtehude died in 1707.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="settings">
          <AccordionTrigger>Settings</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-6">
              <li>Quarter-comma meantone (Maybe Werckmeister III)</li>
              <li>Pedaliter organ (↔ Manualiter)</li>
              <li>Stellwagen/Richborn at St. Mary's, Lübeck, ± 487 Hz</li>
              <li>Different articulation than modern organ legato (Similar to harpsichord)</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="praeludia">
          <AccordionTrigger>Praeludia</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-6">
              <li>Stylus Phantasticus: Improvisational and rhetorical</li>
              <li>Different affects for each phrase</li>
              <li>Free form with juxtaposed sections: free-style sections (toccata) and fugal sections (fuga)</li>
              <li>Wide variety of rhetoric and contrapuntal devices</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="buxwv137">
          <AccordionTrigger>BuxWV 137</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-6">
              <li>Andreas-Bach-Buch (Copied by Johann Christoph Bach and others)</li>
              <li>Pedal solo in the beginning</li>
              <li>(Toccata ↔ Fuga) – Ciaconna – Toccata</li>
            </ul>
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Section</TableHead>
                  <TableHead>Toccata</TableHead>
                  <TableHead>Fuga</TableHead>
                  <TableHead>Ciaconna</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Tempo</TableCell>
                  <TableCell>Contrasting, capricious</TableCell>
                  <TableCell>Consistent, strolling</TableCell>
                  <TableCell>Quite fast, dance-like</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Affect</TableCell>
                  <TableCell>Contrasting, expressive</TableCell>
                  <TableCell>Consistent, rather calm</TableCell>
                  <TableCell>Merry</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Ornamentation</TableCell>
                  <TableCell>Can even change the figurations a bit</TableCell>
                  <TableCell>Slight mordents or trills are enough</TableCell>
                  <TableCell>Slight mordents or trills are enough</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Articulation</TableCell>
                  <TableCell>Recitative</TableCell>
                  <TableCell>Polyphonic</TableCell>
                  <TableCell>Dance</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Dynamics</TableCell>
                  <TableCell>One can change register at the end of each phrase</TableCell>
                  <TableCell>One should not change the register in the whole section</TableCell>
                  <TableCell>Bright</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="bibliography">
          <AccordionTrigger>Bibliography</AccordionTrigger>
          <AccordionContent>
            <h3 className="font-semibold mt-2">Score</h3>
            <p>Andreas-Bach-Buch, D-LEm Becker III.8.4</p>

            <h3 className="font-semibold mt-4">Books</h3>
            <ul className="list-disc pl-6">
              <li>Barbour, Murray J. Tuning and Temperament: A Historical Survey, Dover Publications: 2013.</li>
              <li>Collins, Paul. The Stylus Phantasticus and Free Keyboard Music of the North German Baroque, Taylor & Francis: 2017.</li>
              <li>Haynes, Bruce. Pitch Standards in the Baroque and Classical Periods, Université de Montréal: 1995.</li>
              <li>Ritchie, George, and George B. Stauffer. Organ Technique: Modern and Early, Oxford University Press: 2000.</li>
              <li>Schröder, Dorothea, et al. Ein fürtrefflicher Componist und Organist zu Lübeck: Dieterich Buxtehude (1637-1707), Dräger: Lübeck, 2007.</li>
              <li>Snyder, Kerala J., et al. Dieterich Buxtehude: Organist in Lübeck, University of Rochester Press: 1987.</li>
            </ul>

            <h3 className="font-semibold mt-4">Journals</h3>
            <ul className="list-disc pl-6">
              <li>Webber, Geoffrey. "Buxtehude's Praeludia and the Sonata Publications of Corelli." Early Music 38, no. 2 (2010): 249-61.</li>
              <li>Snyder, Kerala J. "Buxtehude's Organs. Helsingør, Helsingborg, Lübeck-1: The Scandinavian Organs." The Musical Times 126, no. 1708 (1985): 365-69.</li>
              <li>Yearsley, David. "In Buxtehude's Footsteps." Early Music 35, no. 3 (2007): 339-53.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default BuxtehudeOutline;
