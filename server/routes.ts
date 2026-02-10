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

  // === Resources ===

  app.get(api.resources.list.path, async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string,
        category: req.query.category as string,
        status: req.query.status as string,
        isFavorite: req.query.isFavorite === 'true' ? true : undefined,
        tag: req.query.tag as string,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      };

      const resources = await storage.getResources(filters);
      res.json(resources);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.resources.count.path, async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string,
        category: req.query.category as string,
        status: req.query.status as string,
        isFavorite: req.query.isFavorite === 'true' ? true : undefined,
        tag: req.query.tag as string,
      };
      const count = await storage.getResourceCount(filters);
      res.json({ count });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/resources/status-counts', async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string,
        category: req.query.category as string,
        tag: req.query.tag as string,
      };
      const statuses = ["unverified", "verified", "needs_info", "closed", "limited"] as const;
      const counts: Record<string, number> = {};
      for (const status of statuses) {
        counts[status] = await storage.getResourceCount({ ...filters, status });
      }
      res.json(counts);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/resources/export/csv', async (req, res) => {
    const resources = await storage.getResources();

    const header = "Name,Description,Category,Categories,Tags,Status,Address,City,State,Zip,Service Area,Phone,Email,Website,Services,Hours,Eligibility,Access Info,Languages,Internal Notes,Public Notes,Confidence Score,Last Verified At\n";
    const rows = resources.map(r => {
      return [
        r.name,
        r.description,
        r.category,
        (r.categories || []).join('; '),
        (r.tags || []).join('; '),
        r.status,
        r.address,
        r.city,
        r.state,
        r.zip,
        r.serviceArea,
        r.phone,
        r.email,
        r.website,
        r.services,
        r.hours,
        r.eligibility,
        r.accessInfo,
        (r.languages || []).join('; '),
        r.internalNotes,
        r.publicNotes,
        r.confidenceScore?.toString() || '',
        r.lastVerifiedAt?.toISOString() || '',
      ].map(field => `"${(field || '').replace(/"/g, '""')}"`).join(',');
    }).join('\n');

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="resources.csv"');
    res.send(header + rows);
  });

  // Bulk update (must be before :id routes)
  app.put(api.resources.bulkUpdate.path, async (req, res) => {
    try {
      const { ids, updates } = api.resources.bulkUpdate.input.parse(req.body);
      const updated = await storage.bulkUpdateResources(ids, updates);
      res.json(updated);
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

  // === Categories & Tags (from resource data) ===

  app.get(api.resources.categories.path, async (_req, res) => {
    const categories = await storage.getAllCategories();
    res.json(categories);
  });

  app.get(api.resources.tags.path, async (_req, res) => {
    const tags = await storage.getAllTags();
    res.json(tags);
  });

  // === Managed Tags ===

  app.get(api.managedTags.list.path, async (_req, res) => {
    const tags = await storage.getManagedTags();
    res.json(tags);
  });

  app.post(api.managedTags.create.path, async (req, res) => {
    try {
      const input = api.managedTags.create.input.parse(req.body);
      const tag = await storage.createManagedTag(input);
      res.status(201).json(tag);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete('/api/managed-tags/:id', async (req, res) => {
    await storage.deleteManagedTag(Number(req.params.id));
    res.status(204).send();
  });

  // === Managed Categories ===

  app.get(api.managedCategories.list.path, async (_req, res) => {
    const cats = await storage.getManagedCategories();
    res.json(cats);
  });

  app.post(api.managedCategories.create.path, async (req, res) => {
    try {
      const input = api.managedCategories.create.input.parse(req.body);
      const cat = await storage.createManagedCategory(input);
      res.status(201).json(cat);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete('/api/managed-categories/:id', async (req, res) => {
    await storage.deleteManagedCategory(Number(req.params.id));
    res.status(204).send();
  });

  // === Verification Events ===

  app.get('/api/resources/:id/verification-events', async (req, res) => {
    const events = await storage.getVerificationEvents(Number(req.params.id));
    res.json(events);
  });

  app.post('/api/resources/:id/verification-events', async (req, res) => {
    try {
      const resourceId = Number(req.params.id);
      const input = api.verificationEvents.create.input.parse(req.body);
      const event = await storage.createVerificationEvent({ ...input, resourceId });
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === Lists (formerly collections) ===

  app.get(api.lists.list.path, async (_req, res) => {
    const allLists = await storage.getLists();
    res.json(allLists);
  });

  app.post(api.lists.create.path, async (req, res) => {
    try {
      const input = api.lists.create.input.parse(req.body);
      const list = await storage.createList(input);
      res.status(201).json(list);
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

  app.get('/api/lists/:id', async (req, res) => {
    const list = await storage.getList(Number(req.params.id));
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }
    res.json(list);
  });

  app.post('/api/lists/:id/items', async (req, res) => {
    const { resourceId } = req.body;
    await storage.addResourceToList(Number(req.params.id), resourceId);
    res.status(201).send();
  });

  app.delete('/api/lists/:id/items/:resourceId', async (req, res) => {
    await storage.removeResourceFromList(Number(req.params.id), Number(req.params.resourceId));
    res.status(204).send();
  });

  // === Signal Items ===

  app.get(api.signals.list.path, async (req, res) => {
    try {
      const filters = {
        type: req.query.type as string,
        lane: req.query.lane as string,
        search: req.query.search as string,
        limit: req.query.limit ? Number(req.query.limit) : 50,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      };
      const items = await storage.getSignalItems(filters);
      res.json(items);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.signals.count.path, async (req, res) => {
    try {
      const filters = {
        type: req.query.type as string,
        lane: req.query.lane as string,
        search: req.query.search as string,
      };
      const count = await storage.getSignalItemCount(filters);
      res.json({ count });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.signals.get.path, async (req, res) => {
    const item = await storage.getSignalItem(Number(req.params.id));
    if (!item) {
      return res.status(404).json({ message: 'Signal not found' });
    }
    res.json(item);
  });

  app.post(api.signals.create.path, async (req, res) => {
    try {
      const input = api.signals.create.input.parse(req.body);
      const item = await storage.createSignalItem(input);
      res.status(201).json(item);
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

  app.put(api.signals.update.path, async (req, res) => {
    try {
      const input = api.signals.update.input.parse(req.body);
      const item = await storage.updateSignalItem(Number(req.params.id), input);
      res.json(item);
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

  app.delete(api.signals.delete.path, async (req, res) => {
    await storage.deleteSignalItem(Number(req.params.id));
    res.status(204).send();
  });

  // === Providers ===

  app.post(api.providers.lookup.path, async (req, res) => {
    try {
      const { email } = api.providers.lookup.input.parse(req.body);
      const provider = await storage.getProviderByEmail(email.toLowerCase());
      if (!provider) {
        return res.status(404).json({ message: "No provider found with that email" });
      }
      res.json(provider);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.providers.register.path, async (req, res) => {
    try {
      const input = api.providers.register.input.parse(req.body);
      const existing = await storage.getProviderByEmail((input.email || "").toLowerCase());
      if (existing) {
        return res.status(409).json({ message: "A provider with that email already exists" });
      }
      const provider = await storage.createProvider({ ...input, email: (input.email || "").toLowerCase() });
      res.status(201).json(provider);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/providers/:id/resources', async (req, res) => {
    try {
      const providerId = Number(req.params.id);
      const provider = await storage.getProvider(providerId);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      const providerResources = await storage.getResourcesByProviderId(providerId);
      res.json(providerResources);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/providers/:id/update-requests', async (req, res) => {
    try {
      const providerId = Number(req.params.id);
      const provider = await storage.getProvider(providerId);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      const requests = await storage.getUpdateRequests({ submittedBy: provider.email || "" });
      res.json(requests);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === Update Requests ===

  app.get(api.updateRequests.list.path, async (req, res) => {
    try {
      const filters = {
        status: req.query.status as string,
        limit: req.query.limit ? Number(req.query.limit) : 50,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      };
      const requests = await storage.getUpdateRequests(filters);
      res.json(requests);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.updateRequests.count.path, async (req, res) => {
    try {
      const filters = {
        status: req.query.status as string,
      };
      const count = await storage.getUpdateRequestCount(filters);
      res.json({ count });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/update-requests/:id', async (req, res) => {
    try {
      const request = await storage.getUpdateRequest(Number(req.params.id));
      if (!request) {
        return res.status(404).json({ message: "Update request not found" });
      }
      res.json(request);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.updateRequests.create.path, async (req, res) => {
    try {
      const input = api.updateRequests.create.input.parse(req.body);
      const request = await storage.createUpdateRequest(input);
      res.status(201).json(request);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/update-requests/:id/accept', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const request = await storage.getUpdateRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Update request not found" });
      }
      if (request.status !== "new" && request.status !== "in_review") {
        return res.status(400).json({ message: "Request already processed" });
      }

      const proposedChanges = request.proposedChanges as Record<string, any>;
      if (request.resourceId && proposedChanges) {
        await storage.updateResource(request.resourceId, {
          ...proposedChanges,
          lastVerifiedAt: new Date(),
        });

        await storage.createVerificationEvent({
          resourceId: request.resourceId,
          performedByRole: "provider",
          method: "provider_update",
          result: "verified",
          notes: `Provider update accepted. Changes: ${Object.keys(proposedChanges).join(", ")}`,
        });
      }

      const updated = await storage.updateUpdateRequestStatus(id, "accepted", "staff");
      res.json(updated);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/update-requests/:id/reject', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const request = await storage.getUpdateRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Update request not found" });
      }
      if (request.status !== "new" && request.status !== "in_review") {
        return res.status(400).json({ message: "Request already processed" });
      }

      const updated = await storage.updateUpdateRequestStatus(id, "rejected", "staff");
      res.json(updated);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === Public API ===

  app.get(api.public.resources.path, async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string,
        category: req.query.category as string,
        tag: req.query.tag as string,
        limit: req.query.limit ? Number(req.query.limit) : 50,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      };
      const resources = await storage.getPublicResources(filters);
      res.json(resources);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.public.count.path, async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string,
        category: req.query.category as string,
        tag: req.query.tag as string,
      };
      const count = await storage.getPublicResourceCount(filters);
      res.json({ count });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.public.categories.path, async (_req, res) => {
    const categories = await storage.getAllCategories();
    res.json(categories);
  });

  app.get('/api/public/tags', async (_req, res) => {
    const tags = await storage.getAllTags();
    res.json(tags);
  });

  app.get('/api/public/resources/:id', async (req, res) => {
    const resource = await storage.getPublicResource(Number(req.params.id));
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    res.json(resource);
  });

  // === Seed Data ===
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
