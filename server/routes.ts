import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import * as xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Resources
  app.get(api.resources.list.path, async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string,
        category: req.query.category as string,
        status: req.query.status as string,
        isFavorite: req.query.isFavorite === 'true' ? true : undefined
      };
      
      const resources = await storage.getResources(filters);
      res.json(resources);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.resources.get.path, async (req, res) => {
    const resource = await storage.getResource(Number(req.params.id));
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    res.json(resource);
  });

  app.post(api.resources.create.path, async (req, res) => {
    try {
      const input = api.resources.create.input.parse(req.body);
      const resource = await storage.createResource(input);
      res.status(201).json(resource);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.resources.update.path, async (req, res) => {
    try {
      const input = api.resources.update.input.parse(req.body);
      const resource = await storage.updateResource(Number(req.params.id), input);
      res.json(resource);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.resources.delete.path, async (req, res) => {
    await storage.deleteResource(Number(req.params.id));
    res.status(204).send();
  });

  // Export CSV
  app.get(api.resources.export.path, async (req, res) => {
    const resources = await storage.getResources();
    
    const header = "Category,Categories,Name,Phone,Email,Website,Address,Services,Hours,Status,Notes,Access Info,Eligibility,Service Area,Tags\n";
    const rows = resources.map(r => {
      return [
        r.category,
        (r.categories || []).join('; '),
        r.name,
        r.phone,
        r.email,
        r.website,
        r.address,
        r.services,
        r.hours,
        r.status,
        r.notes,
        r.accessInfo,
        r.eligibility,
        r.serviceArea,
        (r.tags || []).join('; ')
      ].map(field => `"${(field || '').replace(/"/g, '""')}"`).join(',');
    }).join('\n');

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="resources.csv"');
    res.send(header + rows);
  });

  // Categories & Tags
  app.get(api.resources.categories.path, async (req, res) => {
    const categories = await storage.getAllCategories();
    res.json(categories);
  });

  app.get('/api/tags', async (req, res) => {
    const tags = await (storage as any).getAllTags();
    res.json(tags);
  });

  // Collections
  app.get(api.collections.list.path, async (req, res) => {
    const collections = await storage.getCollections();
    res.json(collections);
  });

  app.post(api.collections.create.path, async (req, res) => {
    try {
      const input = api.collections.create.input.parse(req.body);
      const collection = await storage.createCollection(input);
      res.status(201).json(collection);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.collections.get.path, async (req, res) => {
    const collection = await storage.getCollection(Number(req.params.id));
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    res.json(collection);
  });

  app.post(api.collections.addItem.path, async (req, res) => {
    const { resourceId } = req.body;
    await storage.addResourceToCollection(Number(req.params.id), resourceId);
    res.status(201).send();
  });

  app.delete(api.collections.removeItem.path, async (req, res) => {
    await storage.removeResourceFromCollection(Number(req.params.id), Number(req.params.resourceId));
    res.status(204).send();
  });

  // Seed Data function
  await seedFromExcel();

  return httpServer;
}

async function seedFromExcel() {
  const count = (await storage.getResources()).length;
  if (count > 0) return;

  console.log("Seeding database from Excel...");
  
  try {
    const excelPath = path.join(process.cwd(), 'attached_assets', 'lanehelp_master_final_ready_1770662026136.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      console.log("Excel file not found, using fallback seed.");
      await storage.createResource({
        category: "DENTAL - EXAMS & PREVENTIVE",
        name: "LANE COMMUNITY COLLEGE DENTAL CLINIC",
        phone: "541-463-5206",
        website: "lanecc.edu",
        address: "2460 Willamette St, Eugene, OR 97405",
        services: "Dental exams, cleanings, X-rays, Fluoride treatment, sealants, oral health education and preventive care.",
        hours: "Mon - Fri | 8 am - 5 pm",
        status: "verified",
        isFavorite: true,
        tags: ["Dental", "Preventive"],
      });
      return;
    }

    const fileBuffer = fs.readFileSync(excelPath);
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet) as any[];

    console.log(`Found ${data.length} rows in Excel.`);

    for (const row of data) {
      const rawTags = (row['Tags'] || '').toString().trim();
      const tags = rawTags ? rawTags.split(';').map((t: string) => t.trim()).filter(Boolean) : [];

      const resource = {
        category: (row['Category'] || 'General').toString().trim(),
        name: (row['Name'] || '').toString().trim(),
        phone: (row['Phone'] || '').toString().trim(),
        email: (row['Email'] || '').toString().trim(),
        website: (row['Website'] || '').toString().trim(),
        address: (row['Address'] || '').toString().trim(),
        services: (row['Description'] || '').toString().trim(),
        hours: (row['Hours'] || '').toString().trim(),
        accessInfo: (row['Access'] || '').toString().trim(),
        eligibility: (row['Eligibility'] || '').toString().trim(),
        serviceArea: (row['Service_Area'] || '').toString().trim(),
        tags: tags.length > 0 ? tags : null,
        status: "unverified" as const,
        isFavorite: false,
      };

      if (resource.name) {
        await storage.createResource(resource);
      }
    }
    console.log("Seeding complete.");
  } catch (error) {
    console.error("Error seeding from Excel:", error);
  }
}
