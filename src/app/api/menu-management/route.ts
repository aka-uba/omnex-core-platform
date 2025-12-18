import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
const MENU_DATA_PATH = path.join(process.cwd(), 'data', 'menu-management.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(MENU_DATA_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load menu data
function loadMenuData(): any {
  ensureDataDir();
  if (fs.existsSync(MENU_DATA_PATH)) {
    const content = fs.readFileSync(MENU_DATA_PATH, 'utf-8');
    return JSON.parse(content);
  }
  return { menus: [], version: 1 };
}

// Save menu data
function saveMenuData(data: any) {
  ensureDataDir();
  fs.writeFileSync(MENU_DATA_PATH, JSON.stringify(data, null, 2));
}

// GET - Load menu structure
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale');
    
    const data = loadMenuData();
    
    // Filter by locale if needed
    const menus = data.menus || [];
    
    return NextResponse.json({
      success: true,
      data: {
        menus,
        locale,
        version: data.version || 1,
      },
    });
  } catch (error) {
    console.error('Error loading menu data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load menu data',
      },
      { status: 500 }
    );
  }
}

// POST - Save menu structure
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { menus } = body;
    
    const data = loadMenuData();
    
    // Update menus
    if (menus) {
      data.menus = menus;
      data.updatedAt = new Date().toISOString();
      data.version = (data.version || 1) + 1;
    }
    
    saveMenuData(data);
    
    return NextResponse.json({
      success: true,
      message: 'Menu structure saved successfully',
      data: {
        menus: data.menus,
        version: data.version,
      },
    });
  } catch (error) {
    console.error('Error saving menu data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save menu data',
      },
      { status: 500 }
    );
  }
}

// PUT - Update specific menu item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { menuId, updates } = body;
    
    const data = loadMenuData();
    const menus = data.menus || [];
    
    // Find and update menu item
    const findAndUpdate = (items: any[]): boolean => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === menuId) {
          Object.assign(items[i], updates);
          return true;
        }
        if (items[i].children && findAndUpdate(items[i].children)) {
          return true;
        }
      }
      return false;
    };
    
    if (findAndUpdate(menus)) {
      data.updatedAt = new Date().toISOString();
      data.version = (data.version || 1) + 1;
      saveMenuData(data);
      
      return NextResponse.json({
        success: true,
        message: 'Menu item updated successfully',
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Menu item not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error updating menu item:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update menu item',
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete menu item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get('id');
    
    if (!menuId) {
      return NextResponse.json(
        { success: false, error: 'Menu ID is required' },
        { status: 400 }
      );
    }
    
    const data = loadMenuData();
    const menus = data.menus || [];
    
    // Find and remove menu item
    const findAndRemove = (items: any[]): boolean => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === menuId) {
          items.splice(i, 1);
          return true;
        }
        if (items[i].children && findAndRemove(items[i].children)) {
          return true;
        }
      }
      return false;
    };
    
    if (findAndRemove(menus)) {
      data.updatedAt = new Date().toISOString();
      data.version = (data.version || 1) + 1;
      saveMenuData(data);
      
      return NextResponse.json({
        success: true,
        message: 'Menu item deleted successfully',
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Menu item not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete menu item',
      },
      { status: 500 }
    );
  }
}






