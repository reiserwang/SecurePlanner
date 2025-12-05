# SecurePlan AI

## Description
This web application provides a comprehensive solution for managing security device placement and configuration projects. The application allows users to upload floor plan images, analyze them using AI-powered recommendations, and then save and refine the device placements based on their feedback.

The core functionality of the application is provided by the following subcomponents:

- *types.ts* : This file defines the central data structures and types used throughout the application, ensuring consistency and enabling seamless communication between different parts of the codebase. It includes interfaces for device specifications, device placements, placement analysis responses, security strategies, chat messages, and saved projects.
- *backend/devices.ts* : This module defines a catalog of various security devices, including cameras, sensors, and detectors. It provides a centralized repository of device information, which can be used by other parts of the application to display device details, make decisions based on device capabilities, and manage device-related functionality.
- *backend/ai.ts*: This module is responsible for analyzing floor plan images and generating recommendations for security device placements. It uses the Google GenAI API to process the floor plan, the device catalog, and user input to provide an initial set of device placements, as well as the ability to refine those placements based on user feedback.
- *backend/library.ts* : This module provides a service for managing the persistence of security project data in the browser's local storage. It allows users to save, load, update, and delete their security project configurations, ensuring that their work is available across multiple sessions.
- *backend/db.ts* : This module is a low-level interface for interacting with the browser's local storage to save and retrieve the list of saved security projects. It provides a simple API for managing the project data, handling potential errors, and ensuring data integrity.
- *services/storageService.ts* : This module abstracts the complexities of working with the browser's localStorage API, providing a set of reusable functions for saving, loading, and deleting project data. It ensures that the project data is persisted reliably and efficiently, and handles potential issues like storage quota limitations.

Together, these subcomponents form a comprehensive web application for security project management. Users can upload floor plans, receive AI-generated device placement recommendations, refine the placements based on their feedback, and save their projects for later use. The application leverages the browser's local storage to provide a seamless and persistent user experience, while also maintaining the integrity and security of the project data.

## Future Works
1. Improve the architecture for a cleaner separation between the frontend and backend
2. Enable the frontend architecture to function as a mobile app supporting both iOS and Android platforms
3. Utilization of large language models (LLMs) while minimizing redundancy and being cost-effective 